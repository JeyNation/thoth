'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Box } from '@mui/material';
import { useZoom } from '../hooks/useZoom';
import { usePan } from '../hooks/usePan';
import { useAreaSelection } from '../hooks/useAreaSelection';
import { normalizeBoundingBoxes } from '../types/mapping';
import { useMapping } from '../context/MappingContext';
import { ViewerControls } from './viewer/ViewerControls';
import { ViewerPage } from './viewer/ViewerPage';
import { LoadingIndicator } from './common/LoadingIndicator';

import type { BoundingBox } from '../types/mapping';
import {
  VIEWER_ROOT_SX,
  VIEWER_CONTAINER_SX,
  getSelectionRectStyle as getViewerSelectionRectStyle,
} from '../styles/viewerStyles';

const DEFAULT_AUTO_FIT_CONFIG = (svgContent: string, svgHostRef: React.RefObject<HTMLDivElement>) => ({
  svgContent,
  svgHostRef,
  mode: 'width' as const,
  retries: 4
});

interface ViewerProps {
  documentData: any;
  focusedInputField?: string | null;
  onBoundingBoxesUpdate?: (boxes: BoundingBox[]) => void;
  onViewerTransformChange?: (scale: number, position: { x: number; y: number }) => void;
  onBoundingBoxFocus?: (boxGeneratedId: string | null) => void;
  onOverlaysVisibilityChange?: (visible: boolean) => void;
}

const Viewer = ({ documentData, focusedInputField, onBoundingBoxesUpdate, onViewerTransformChange, onBoundingBoxFocus, onOverlaysVisibilityChange }: ViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const boxStyleCacheRef = useRef<Map<string, { key: string; style: CSSProperties }>>(new Map());
  const lastBoxesRef = useRef<BoundingBox[] | null>(null);
  
  const [baseSvgDims, setBaseSvgDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [showOverlays, setShowOverlays] = useState(true);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [loadedPages, setLoadedPages] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { fieldSources, reverseIndex } = useMapping();
  const { scale, setScale, resetView } = useZoom({ 
    containerRef,
    autoFit: DEFAULT_AUTO_FIT_CONFIG(svgContent, svgRef)
  });
  const { isDragging, isKeyActive, position, beginPanAt, resetPan, setIsDragging } = usePan({ containerRef });
  const { isAreaSelecting, selectionStart, selectionEnd, beginSelection, updateSelection, cancelSelection, getSelectionRectStyle } = useAreaSelection();

  const focusedInputLinkedBoxIds = useMemo(() => {
    if (!focusedInputField) return new Set<string>();
    const entry = fieldSources[focusedInputField];
    if (!entry || !entry.ids) return new Set<string>();
    return new Set(entry.ids);
  }, [focusedInputField, fieldSources]);

  const allLinkedBoxIds = useMemo(() => {
    if (reverseIndex) {
      return new Set<string>(Object.keys(reverseIndex));
    }
    const s = new Set<string>();
    Object.values(fieldSources).forEach(entry => entry.ids.forEach(id => s.add(id)));
    return s;
  }, [fieldSources, reverseIndex]);

  const getBoundingBoxStyle = useCallback((boundingBox: BoundingBox) => {
    const isSelected = selectedFields.has(boundingBox.fieldId);
    const isLinked = allLinkedBoxIds.has(boundingBox.id);
    const isFocusedLinked = focusedInputLinkedBoxIds.has(boundingBox.id);
    const isDragged = draggedField === boundingBox.fieldId;

    const key = `${boundingBox.minX}|${boundingBox.minY}|${boundingBox.width}|${boundingBox.height}|${isSelected?1:0}${isLinked?1:0}${isFocusedLinked?1:0}${isDragged?1:0}`;
    const cached = boxStyleCacheRef.current.get(boundingBox.fieldId);
    if (cached && cached.key === key) return cached.style;

    let backgroundColor = 'rgba(0, 123, 255, 0.1)';
    let borderColor = '#007bff';
    if (isLinked) { backgroundColor = 'rgba(76, 175, 80, 0.2)'; borderColor = '#4caf50'; }
    if (isFocusedLinked) { backgroundColor = 'rgba(46, 125, 50, 0.32)'; borderColor = '#2e7d32'; }
    if (isSelected) {
      if (isLinked || isFocusedLinked) { backgroundColor = 'rgba(46,125,50,0.40)'; borderColor = '#1b5e20'; }
      else { backgroundColor = 'rgba(33,150,243,0.4)'; borderColor = '#1976d2'; }
    }

    let boxShadow = 'none';
    if (isSelected) boxShadow = `0 0 10px ${borderColor}66`;
    else if (isFocusedLinked) boxShadow = '0 0 8px rgba(46,125,50,0.45)';
    else if (isLinked) boxShadow = '0 0 5px rgba(76, 175, 80, 0.3)';

    const style: CSSProperties = {
      position: 'absolute',
      left: boundingBox.minX,
      top: boundingBox.minY,
      width: boundingBox.width,
      height: boundingBox.height,
      backgroundColor,
      border: `${isSelected ? '3' : '2'}px solid ${borderColor}`,
      borderRadius: 3,
      cursor: 'grab',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 'bold',
      color: borderColor,
      opacity: 1,
      boxShadow,
      transition: 'all 0.2s ease'
    };

    boxStyleCacheRef.current.set(boundingBox.fieldId, { key, style });
    return style;
  }, [selectedFields, allLinkedBoxIds, focusedInputLinkedBoxIds, draggedField]);

  useEffect(() => {
    if (documentData?.svgImages) {
      const images = documentData.svgImages as string[];
      setTotalPages(images.length);
      setLoadedPages(1);
      setSvgContent(images[0]);
      setLoading((prev) => (prev ? false : prev));
    }

    if (documentData?.boundingBoxes) {
      const normalized = normalizeBoundingBoxes(documentData.boundingBoxes);
      const prev = lastBoxesRef.current;
      const sameLength = prev ? prev.length === normalized.length : false;
      let same = !!prev && sameLength;
      if (same) {
        for (let i = 0; i < prev!.length; i++) {
          const a = prev![i]; const b = normalized[i];
          if (
            a.fieldId !== b.fieldId ||
            a.id !== b.id ||
            a.minX !== b.minX || a.minY !== b.minY || a.width !== b.width || a.height !== b.height
          ) { same = false; break; }
        }
      }
      if (!same) {
        setBoundingBoxes(normalized);
        onBoundingBoxesUpdate?.(normalized);
        lastBoxesRef.current = normalized;
      }
    }
  }, [documentData, onBoundingBoxesUpdate]);

  useEffect(() => {
    if (!svgContent) return;

    const host = svgRef.current;
    if (!host) return;

    const tryMeasure = () => {
      const svgEl = host.querySelector('svg') as (SVGSVGElement | null);
      if (!svgEl) return false;

      let w = 0; let h = 0;
      if (svgEl.viewBox && svgEl.viewBox.baseVal && svgEl.viewBox.baseVal.width && svgEl.viewBox.baseVal.height) {
        w = svgEl.viewBox.baseVal.width;
        h = svgEl.viewBox.baseVal.height;
      } else if (svgEl.width && svgEl.height && typeof svgEl.width.baseVal?.value === 'number' && svgEl.width.baseVal.value && svgEl.height.baseVal.value) {
        w = svgEl.width.baseVal.value; h = svgEl.height.baseVal.value;
      } else {
        const bb = svgEl.getBBox?.();
        if (bb && bb.width && bb.height) { 
          w = bb.width; 
          h = bb.height;
        }
        else {
          const rect = svgEl.getBoundingClientRect();
          w = rect.width; h = rect.height;
        }
      }
      if (w && h) {
        setBaseSvgDims({ width: w, height: h });
        return true;
      }
      return false;
    };
    let attempts = 0; let raf: number;
    const loop = () => {
      if (tryMeasure() || attempts++ > 5) return;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [svgContent]);

  useEffect(() => { 
    onViewerTransformChange?.(scale, position); 
  }, [scale, position, onViewerTransformChange]);

  useEffect(() => {
    onOverlaysVisibilityChange?.(showOverlays);
  }, [showOverlays, onOverlaysVisibilityChange]);

  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      const panelEl = containerRef.current;
      if (!panelEl) return;
      if (!panelEl.contains(e.target as Node)) {
        if (selectedFields.size) {
          setSelectedFields(new Set());
          onBoundingBoxFocus?.(null);
        }
      }
    };
    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
  }, [selectedFields, onBoundingBoxFocus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isLoadingMore || loadedPages >= totalPages) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (scrolledToBottom && loadedPages < totalPages) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setLoadedPages(prev => Math.min(prev + 1, totalPages));
          setIsLoadingMore(false);
        }, 100);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadedPages, totalPages, isLoadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoadingMore || loadedPages >= totalPages) return;

    const checkIfNeedsMorePages = () => {
      const { scrollHeight, clientHeight } = container;
      const hasScrollbar = scrollHeight > clientHeight;

      if (!hasScrollbar && loadedPages < totalPages) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setLoadedPages(prev => Math.min(prev + 1, totalPages));
          setIsLoadingMore(false);
        }, 100);
      }
    };

    const timeoutId = setTimeout(checkIfNeedsMorePages, 200);
    return () => clearTimeout(timeoutId);
  }, [loadedPages, totalPages, isLoadingMore, svgContent]);

  useEffect(() => {
    if (selectedFields.size === 0) {
      onBoundingBoxFocus?.(null);
    }
  }, [selectedFields, onBoundingBoxFocus]);

  useEffect(() => {
    if (svgContent !== undefined || boundingBoxes.length >= 0) {
      boxStyleCacheRef.current.clear();
    }
  }, [svgContent, boundingBoxes.length]);

  const handleFieldSelection = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      const newSelection = new Set(selectedFields);
      if (newSelection.has(fieldId)) {
        newSelection.delete(fieldId);
      } else {
        newSelection.add(fieldId);
      }
      setSelectedFields(newSelection);
      onBoundingBoxFocus?.(null);
      return;
    } else {
      if (!selectedFields.has(fieldId)) {
        setSelectedFields(new Set([fieldId]));
      }
    }
    const box = boundingBoxes.find(b => b.fieldId === fieldId);
    if (box && box.id) onBoundingBoxFocus?.(box.id);
  };

  const handleFieldDragStart = (e: React.DragEvent, boundingBox: BoundingBox) => {
    setDraggedField(boundingBox.fieldId);
    
    let dragText = boundingBox.fieldText;
    let dragFieldIds = [boundingBox.fieldId];
    
    if (selectedFields.has(boundingBox.fieldId) && selectedFields.size > 1) {
      const selectedBoxes = boundingBoxes.filter(box => selectedFields.has(box.fieldId));
      
      selectedBoxes.sort((a, b) => {
        const aTop = Math.min(...a.points.map(p => p.y));
        const bTop = Math.min(...b.points.map(p => p.y));
        const aLeft = Math.min(...a.points.map(p => p.x));
        const bLeft = Math.min(...b.points.map(p => p.x));
        
        if (Math.abs(aTop - bTop) < 10) {
          return aLeft - bLeft;
        }
        return aTop - bTop;
      });
      
      const textParts: string[] = [];
      for (let i = 0; i < selectedBoxes.length; i++) {
        textParts.push(selectedBoxes[i].fieldText);
        
        if (i < selectedBoxes.length - 1) {
          const currentTop = Math.min(...selectedBoxes[i].points.map(p => p.y));
          const nextTop = Math.min(...selectedBoxes[i + 1].points.map(p => p.y));
          
          if (Math.abs(nextTop - currentTop) > 10) {
            textParts.push('\n');
          } else {
            textParts.push(' ');
          }
        }
      }
      
      dragText = textParts.join('');
      dragFieldIds = selectedBoxes.map(box => box.fieldId);
    }
    
    const selectedBoxesForDrag = (selectedFields.has(boundingBox.fieldId) && selectedFields.size > 1)
      ? boundingBoxes.filter(box => selectedFields.has(box.fieldId))
      : [boundingBox];

    const pairsWithCenters = selectedBoxesForDrag.map(b => {
      const xs = b.points.map(p => p.x);
      const ys = b.points.map(p => p.y);
      const minXb = Math.min(...xs);
      const maxXb = Math.max(...xs);
      let minYb = Math.min(...ys);
      let maxYb = Math.max(...ys);
      
      // Adjust Y coordinates for page offset when dealing with multi-page selections
      const pageIndex = (b.page || 1) - 1;
      if (pageIndex > 0) {
        // Calculate cumulative vertical offset for this bounding box's page (in unscaled coordinates)
        let cumulativeOffset = 0;
        for (let i = 0; i < pageIndex; i++) {
          const prevParser = new DOMParser();
          const prevDoc = prevParser.parseFromString(documentData?.svgImages[i] || '', 'image/svg+xml');
          const prevSvgEl = prevDoc.querySelector('svg');
          let prevPageHeight = baseSvgDims.height;
          
          if (prevSvgEl) {
            if (prevSvgEl.viewBox && prevSvgEl.viewBox.baseVal && prevSvgEl.viewBox.baseVal.height) {
              prevPageHeight = prevSvgEl.viewBox.baseVal.height;
            } else if (prevSvgEl.getAttribute('height')) {
              prevPageHeight = parseFloat(prevSvgEl.getAttribute('height')!);
            }
          }
          
          // Account for page height + divider spacing (33px total = 32px margin + 1px height)
          cumulativeOffset += prevPageHeight + (33 / scale);
        }
        
        // Add the page offset to Y coordinates
        minYb += cumulativeOffset;
        maxYb += cumulativeOffset;
      }
      
      const centerX = (minXb + maxXb) / 2;
      const centerY = (minYb + maxYb) / 2;
      return { fieldId: b.fieldId, boxId: b.id!, text: b.fieldText, centerX, left: minXb, right: maxXb, top: minYb, bottom: maxYb, centerY };
    });

    const dragData = {
      text: dragText,
      fieldId: boundingBox.fieldId,
      fieldIds: dragFieldIds,
      boundingBoxIds: selectedBoxesForDrag.map(b => b.id!),
      pairs: pairsWithCenters,
      isMultiField: dragFieldIds.length > 1
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePanelMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    const target = e.target as HTMLElement;
    const active = document.activeElement as HTMLElement | null;
    const isEditable = !!(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable));
    if (isEditable) return;
    if (isKeyActive) {
      beginPanAt(e.clientX, e.clientY);
      cancelSelection();
    } else if (!target.draggable && !target.closest('[data-field-id]')) {
      if (selectedFields.size) {
        setSelectedFields(new Set());
      }
      const rect = containerRef.current?.getBoundingClientRect();
      const containerEl = containerRef.current;
      if (rect && containerEl) {
        const x = (e.clientX - rect.left + containerEl.scrollLeft) / scale;
        const y = (e.clientY - rect.top + containerEl.scrollTop) / scale;
        beginSelection({ x, y });
      }
    }
  };

  const handlePanelMouseMove = (e: React.MouseEvent) => {
    if (!isAreaSelecting) return;
    const containerEl = containerRef.current;
    const rect = containerEl?.getBoundingClientRect();
    if (rect && containerEl) {
      const scrollLeft = containerEl.scrollLeft;
      const scrollTop = containerEl.scrollTop;
      const x = (e.clientX - rect.left + scrollLeft) / scale;
      const y = (e.clientY - rect.top + scrollTop) / scale;
      updateSelection({ x, y });
    }
  };

  const handlePanelMouseUp = (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - mouseDownPos.x);
    const dy = Math.abs(e.clientY - mouseDownPos.y);
    const isClick = dx < 5 && dy < 5;
    if (isAreaSelecting) {
      const selectionRect = {
        left: Math.min(selectionStart!.x, selectionEnd!.x),
        top: Math.min(selectionStart!.y, selectionEnd!.y),
        right: Math.max(selectionStart!.x, selectionEnd!.x),
        bottom: Math.max(selectionStart!.y, selectionEnd!.y)
      };
      const ids = new Set<string>();
      
      // Create a cache for page offsets to avoid recalculating
      const pageOffsets = new Map<number, number>();
      const containerEl = containerRef.current;
      
      // Try to get actual page elements for accurate spacing measurement
      let useActualSpacing = false;
      if (containerEl) {
        const pageElements = containerEl.querySelectorAll('[data-page-index]');
        const firstPageEl = pageElements[0] as HTMLElement;
        
        if (firstPageEl && pageElements.length > 1) {
          const firstSvgContainer = firstPageEl.querySelector('[data-svg-container]') as HTMLElement;
          
          if (firstSvgContainer) {
            const containerRect = containerEl.getBoundingClientRect();
            const scrollTop = containerEl.scrollTop;
            const firstSvgRect = firstSvgContainer.getBoundingClientRect();
            const firstSvgTop = firstSvgRect.top - containerRect.top + scrollTop;
            
            pageOffsets.set(0, 0); // First page has no offset
            
            for (let i = 1; i < pageElements.length; i++) {
              const pageEl = pageElements[i] as HTMLElement;
              const svgContainer = pageEl.querySelector('[data-svg-container]') as HTMLElement;
              if (svgContainer) {
                const svgRect = svgContainer.getBoundingClientRect();
                const svgTop = svgRect.top - containerRect.top + scrollTop;
                pageOffsets.set(i, (svgTop - firstSvgTop) / scale);
              }
            }
            useActualSpacing = pageOffsets.size > 1;
          }
        }
      }
      
      // For multi-page documents, we need to check bounding boxes against their actual page positions
      boundingBoxes.forEach(b => {
        const pageIndex = (b.page || 1) - 1;
        let cumulativeOffset = 0;
        
        if (useActualSpacing && pageOffsets.has(pageIndex)) {
          cumulativeOffset = pageOffsets.get(pageIndex)!;
        } else {
          // Fallback to calculated offset
          for (let i = 0; i < pageIndex; i++) {
            const prevParser = new DOMParser();
            const prevDoc = prevParser.parseFromString(documentData?.svgImages[i] || '', 'image/svg+xml');
            const prevSvgEl = prevDoc.querySelector('svg');
            let prevPageHeight = baseSvgDims.height;
            
            if (prevSvgEl) {
              if (prevSvgEl.viewBox && prevSvgEl.viewBox.baseVal && prevSvgEl.viewBox.baseVal.height) {
                prevPageHeight = prevSvgEl.viewBox.baseVal.height;
              } else if (prevSvgEl.getAttribute('height')) {
                prevPageHeight = parseFloat(prevSvgEl.getAttribute('height')!);
              }
            }
            
            // Use measured spacing - divider has my: 2 (32px) + height: 1px = 33px total
            cumulativeOffset += prevPageHeight + (33 / scale);
          }
        }
        
        // Adjust bounding box coordinates to global coordinate system
        const xs = b.points.map(p => p.x);
        const ys = b.points.map(p => p.y + cumulativeOffset);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        // Check if bounding box intersects with selection rectangle
        if (!(maxX < selectionRect.left || minX > selectionRect.right || maxY < selectionRect.top || minY > selectionRect.bottom)) {
          ids.add(b.fieldId);
        }
      });
      
      setSelectedFields(ids);
      onBoundingBoxFocus?.(null);
      cancelSelection();
    } else if (isClick && !isDragging && !isKeyActive) {
      const target = e.target as HTMLElement;
      if (!target.draggable && !target.closest('[data-field-id]') && !e.ctrlKey && !e.metaKey) {
        setSelectedFields(new Set());
        onBoundingBoxFocus?.(null);
      }
    }
    setIsDragging(false); setDraggedField(null);
  };

  const handlePanelMouseLeave = () => {
    setIsDragging(false);
    setDraggedField(null);
    if (isAreaSelecting) {
      cancelSelection();
    }
  };

  // Calculate page-specific selection rectangle styles
  const calculatePageSelectionStyle = (pageIndex: number, pageHeight: number): CSSProperties => {
    if (!isAreaSelecting || !selectionStart || !selectionEnd) {
      return { display: 'none' };
    }

    // Calculate cumulative vertical offset for this page
    let cumulativeOffset = 0;
    const containerEl = containerRef.current;
    
    // Try to get accurate page spacing by measuring DOM elements
    if (containerEl && pageIndex > 0) {
      const pageElements = containerEl.querySelectorAll('[data-page-index]');
      
      if (pageElements.length > pageIndex) {
        const firstPageEl = pageElements[0] as HTMLElement;
        const currentPageEl = pageElements[pageIndex] as HTMLElement;
        
        // Get the SVG elements within each page to measure their actual positions
        const firstSvgContainer = firstPageEl.querySelector('[data-svg-container]') as HTMLElement;
        const currentSvgContainer = currentPageEl.querySelector('[data-svg-container]') as HTMLElement;
        
        if (firstSvgContainer && currentSvgContainer) {
          const containerRect = containerEl.getBoundingClientRect();
          const scrollTop = containerEl.scrollTop;
          
          const firstSvgRect = firstSvgContainer.getBoundingClientRect();
          const currentSvgRect = currentSvgContainer.getBoundingClientRect();
          
          const firstSvgTop = firstSvgRect.top - containerRect.top + scrollTop;
          const currentSvgTop = currentSvgRect.top - containerRect.top + scrollTop;
          
          cumulativeOffset = (currentSvgTop - firstSvgTop) / scale;
        } else {
          // Fallback: calculate based on page heights and Material-UI spacing
          for (let i = 0; i < pageIndex; i++) {
            const prevParser = new DOMParser();
            const prevDoc = prevParser.parseFromString(documentData?.svgImages[i] || '', 'image/svg+xml');
            const prevSvgEl = prevDoc.querySelector('svg');
            let prevPageHeight = baseSvgDims.height;
            
            if (prevSvgEl) {
              if (prevSvgEl.viewBox && prevSvgEl.viewBox.baseVal && prevSvgEl.viewBox.baseVal.height) {
                prevPageHeight = prevSvgEl.viewBox.baseVal.height;
              } else if (prevSvgEl.getAttribute('height')) {
                prevPageHeight = parseFloat(prevSvgEl.getAttribute('height')!);
              }
            }
            
            // Account for page height + divider spacing
            // The divider has my: 2 (32px total) and height: 1px = 33px total
            cumulativeOffset += prevPageHeight + (33 / scale);
          }
        }
      }
    }

    // Calculate page bounds in global unscaled coordinates
    const pageTop = cumulativeOffset;
    const pageBottom = pageTop + pageHeight;

    // Get selection bounds (already in unscaled coordinates)
    const selectionTop = Math.min(selectionStart.y, selectionEnd.y);
    const selectionBottom = Math.max(selectionStart.y, selectionEnd.y);
    const selectionLeft = Math.min(selectionStart.x, selectionEnd.x);
    const selectionRight = Math.max(selectionStart.x, selectionEnd.x);

    // Check if selection intersects with this page
    if (selectionBottom < pageTop || selectionTop > pageBottom) {
      return { display: 'none' };
    }

    // Calculate intersection bounds relative to the page
    const intersectionTop = Math.max(0, selectionTop - pageTop);
    const intersectionBottom = Math.min(pageHeight, selectionBottom - pageTop);
    const intersectionLeft = selectionLeft;
    const intersectionRight = selectionRight;

    if (intersectionTop >= intersectionBottom) {
      return { display: 'none' };
    }

    return getViewerSelectionRectStyle({
      left: `${intersectionLeft}px`,
      top: `${intersectionTop}px`,
      width: `${intersectionRight - intersectionLeft}px`,
      height: `${intersectionBottom - intersectionTop}px`
    });
  };

  if (loading) {
    return <LoadingIndicator message="Loading document..." sx={{ p: 3, height: '100%' }} />;
  }

  return (
    <Box sx={VIEWER_ROOT_SX}>
      <ViewerControls
        boundingBoxCount={boundingBoxes.length}
        loadedPages={loadedPages}
        totalPages={totalPages}
        showOverlays={showOverlays}
        onZoomIn={() => setScale(s => Math.min(5, s * 1.2))}
        onZoomOut={() => setScale(s => Math.max(0.1, s / 1.2))}
        onResetView={() => { resetView(); resetPan(); }}
        onToggleOverlays={() => setShowOverlays(prev => !prev)}
      />

      <Box
        ref={containerRef}
        sx={VIEWER_CONTAINER_SX(isKeyActive, isDragging)}
        data-scroll-listener
        data-svg-container
        onMouseDown={handlePanelMouseDown}
        onMouseMove={handlePanelMouseMove}
        onMouseUp={handlePanelMouseUp}
        onMouseLeave={handlePanelMouseLeave}
      >
        {documentData?.svgImages && (documentData.svgImages as string[]).slice(0, loadedPages).map((pageContent: string, pageIndex: number) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(pageContent, 'image/svg+xml');
          const svgEl = doc.querySelector('svg');
          let pageWidth = baseSvgDims.width;
          let pageHeight = baseSvgDims.height;
          
          if (svgEl) {
            if (svgEl.viewBox && svgEl.viewBox.baseVal && svgEl.viewBox.baseVal.width) {
              pageWidth = svgEl.viewBox.baseVal.width;
              pageHeight = svgEl.viewBox.baseVal.height;
            } else if (svgEl.getAttribute('width') && svgEl.getAttribute('height')) {
              pageWidth = parseFloat(svgEl.getAttribute('width')!);
              pageHeight = parseFloat(svgEl.getAttribute('height')!);
            }
          }
          
          const pageBoxes = boundingBoxes.filter(box => box.page === pageIndex + 1);
          const pageSelectionStyle = calculatePageSelectionStyle(pageIndex, pageHeight);
          
          return (
            <ViewerPage
              key={pageIndex}
              pageContent={pageContent}
              pageIndex={pageIndex}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              scale={scale}
              isDragging={isDragging}
              showOverlays={showOverlays}
              pageBoxes={pageBoxes}
              focusedInputLinkedBoxIds={focusedInputLinkedBoxIds}
              selectionRectStyle={pageSelectionStyle}
              isFirstPage={pageIndex === 0}
              isLastLoadedPage={pageIndex === loadedPages - 1}
              svgRef={svgRef}
              getBoundingBoxStyle={getBoundingBoxStyle}
              onFieldDragStart={handleFieldDragStart}
              onFieldSelection={handleFieldSelection}
            />
          );
        })}
        {isLoadingMore && <LoadingIndicator message="Loading more pages..." />}
      </Box>
    </Box>
  );
};

export default Viewer;