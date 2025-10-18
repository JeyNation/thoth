'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useZoom } from '../hooks/useZoom';
import { usePan } from '../hooks/usePan';
import { useAreaSelection } from '../hooks/useAreaSelection';
import { normalizeBoundingBoxes } from '../types/mapping';
import { useMapping } from '../context/MappingContext';

import type { BoundingBox } from '../types/mapping';

interface ViewerProps {
  documentData: any;
  focusedInputField?: string | null;
  onBoundingBoxesUpdate?: (boxes: BoundingBox[]) => void;
  onViewerTransformChange?: (scale: number, position: { x: number; y: number }) => void;
  onBoundingBoxFocus?: (boxGeneratedId: string | null) => void;
}

const Viewer = ({ documentData, focusedInputField, onBoundingBoxesUpdate, onViewerTransformChange, onBoundingBoxFocus }: ViewerProps) => {
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const boxStyleCacheRef = useRef<Map<string, { key: string; style: CSSProperties }>>(new Map());
  
  // states
  const [baseSvgDims, setBaseSvgDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [showOverlays, setShowOverlays] = useState(true);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  // custom hooks
  const { fieldSources, reverseIndex } = useMapping();
  const { scale, setScale, resetView } = useZoom({ containerRef,
    autoFit: {
      svgContent,
      svgHostRef: svgRef,
      mode: 'width',
      retries: 4
    }
  });
  const { isDragging, isKeyActive, position, beginPanAt, resetPan, setIsDragging } = usePan({ containerRef });
  const { isAreaSelecting, selectionStart, selectionEnd, beginSelection, updateSelection, cancelSelection, getSelectionRectStyle } = useAreaSelection();

  // derived: set of box ids linked to currently focused input field
  const focusedInputLinkedBoxIds = useMemo(() => {
    if (!focusedInputField) return new Set<string>();
    const entry = fieldSources[focusedInputField];
    if (!entry || !entry.ids) return new Set<string>();
    return new Set(entry.ids);
  }, [focusedInputField, fieldSources]);

  // derived: set of all box ids linked to any field
  const allLinkedBoxIds = useMemo(() => {
    if (reverseIndex) {
      return new Set<string>(Object.keys(reverseIndex));
    }
    const s = new Set<string>();
    Object.values(fieldSources).forEach(entry => entry.ids.forEach(id => s.add(id)));
    return s;
  }, [fieldSources, reverseIndex]);

  // callback: get style for a bounding box, with caching
  const getBoundingBoxStyle = useCallback((boundingBox: BoundingBox) => {
    const isSelected = selectedFields.has(boundingBox.FieldId);
    const isLinked = allLinkedBoxIds.has(boundingBox.generatedId);
    const isFocusedLinked = focusedInputLinkedBoxIds.has(boundingBox.generatedId);
    const isDragged = draggedField === boundingBox.FieldId;

    // Build a compact cache key (geometry + state bits)
    const key = `${boundingBox.minX}|${boundingBox.minY}|${boundingBox.width}|${boundingBox.height}|${isSelected?1:0}${isLinked?1:0}${isFocusedLinked?1:0}${isDragged?1:0}`;
    const cached = boxStyleCacheRef.current.get(boundingBox.FieldId);
    if (cached && cached.key === key) return cached.style;

    // Derive colors (flatten original branching into a deterministic priority order)
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
      opacity: isDragged ? 0.5 : 1,
      boxShadow,
      transition: 'all 0.2s ease'
    };

    boxStyleCacheRef.current.set(boundingBox.FieldId, { key, style });
    return style;
  }, [selectedFields, allLinkedBoxIds, focusedInputLinkedBoxIds, draggedField, svgContent, boundingBoxes.length]);

  // state change: initial document load
  useEffect(() => {
    // load SVG document
    if (documentData?.SvgInfo?.SvgImages?.[0]) {
      setSvgContent(documentData.SvgInfo.SvgImages[0]);
      setLoading(false);
    }
    
    // load interactive bounding boxes
    if (documentData?.SvgInfo?.BoundingBoxes) {
      const normalized = normalizeBoundingBoxes(documentData.SvgInfo.BoundingBoxes);
      setBoundingBoxes(normalized);
      onBoundingBoxesUpdate?.(normalized);
    }
  }, [documentData]);

  // measure base SVG dimensions (once per svgContent change)
  useEffect(() => {
    if (!svgContent) return;

    const host = svgRef.current;
    if (!host) return;

    const tryMeasure = () => {
      const svgEl = host.querySelector('svg') as (SVGSVGElement | null);
      if (!svgEl) return false;

      // Prefer viewBox for intrinsic size, fallback to bounding box / client rect
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
    // Attempt a few animation frames if initial measure fails (SVG not fully laid out yet)
    let attempts = 0; let raf: number;
    const loop = () => {
      if (tryMeasure() || attempts++ > 5) return;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [svgContent]);

  // state change: notify viewer transform changes
  useEffect(() => { 
    onViewerTransformChange?.(scale, position); 
  }, [scale, position, onViewerTransformChange]);

  // state change: clear selection when clicking anywhere outside the viewer panel
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

  // state change: clear external focused box when selection becomes empty
  useEffect(() => {
    if (selectedFields.size === 0) {
      onBoundingBoxFocus?.(null);
    }
  }, [selectedFields, onBoundingBoxFocus]);

  // state change: clear cache when the source document changes (svgContent) or bounding boxes list length changes.
  useEffect(() => { 
    boxStyleCacheRef.current.clear(); 
  }, [svgContent, boundingBoxes.length]);

  // event handler: field clicked
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
    } else {
      if (selectedFields.has(fieldId) && selectedFields.size === 1) {
        setSelectedFields(new Set());
      } else {
        setSelectedFields(new Set([fieldId]));
      }
    }
    // Update focused bounding box to last clicked (single focus concept)
    const box = boundingBoxes.find(b => b.FieldId === fieldId);
    if (box && box.generatedId) onBoundingBoxFocus?.(box.generatedId);
  };

  // event handler: field drag started
  const handleFieldDragStart = (e: React.DragEvent, boundingBox: BoundingBox) => {
    setDraggedField(boundingBox.FieldId);
    
    let dragText = boundingBox.FieldText;
    let dragFieldIds = [boundingBox.FieldId];
    
    if (selectedFields.has(boundingBox.FieldId) && selectedFields.size > 1) {
      const selectedBoxes = boundingBoxes.filter(box => selectedFields.has(box.FieldId));
      
      selectedBoxes.sort((a, b) => {
        const aTop = Math.min(...a.Points.map(p => p.Y));
        const bTop = Math.min(...b.Points.map(p => p.Y));
        const aLeft = Math.min(...a.Points.map(p => p.X));
        const bLeft = Math.min(...b.Points.map(p => p.X));
        
        if (Math.abs(aTop - bTop) < 10) {
          return aLeft - bLeft;
        }
        return aTop - bTop;
      });
      
      const textParts: string[] = [];
      for (let i = 0; i < selectedBoxes.length; i++) {
        textParts.push(selectedBoxes[i].FieldText);
        
        if (i < selectedBoxes.length - 1) {
          const currentTop = Math.min(...selectedBoxes[i].Points.map(p => p.Y));
          const nextTop = Math.min(...selectedBoxes[i + 1].Points.map(p => p.Y));
          
          if (Math.abs(nextTop - currentTop) > 10) {
            textParts.push('\n');
          } else {
            textParts.push(' ');
          }
        }
      }
      
      dragText = textParts.join('');
      dragFieldIds = selectedBoxes.map(box => box.FieldId);
    }
    
    const selectedBoxesForDrag = (selectedFields.has(boundingBox.FieldId) && selectedFields.size > 1)
      ? boundingBoxes.filter(box => selectedFields.has(box.FieldId))
      : [boundingBox];

    const pairsWithCenters = selectedBoxesForDrag.map(b => {
      const xs = b.Points.map(p => p.X);
      const ys = b.Points.map(p => p.Y);
      const minXb = Math.min(...xs);
      const maxXb = Math.max(...xs);
      const minYb = Math.min(...ys);
      const maxYb = Math.max(...ys);
      const centerX = (minXb + maxXb) / 2;
      const centerY = (minYb + maxYb) / 2;
      return { fieldId: b.FieldId, boxId: b.generatedId!, text: b.FieldText, centerX, left: minXb, right: maxXb, top: minYb, bottom: maxYb, centerY };
    });

    const dragData = {
      text: dragText,
      fieldId: boundingBox.FieldId,
      fieldIds: dragFieldIds,
      boundingBoxIds: selectedBoxesForDrag.map(b => b.generatedId!),
      pairs: pairsWithCenters,
      isMultiField: dragFieldIds.length > 1
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // event handler: mouse down on the viewer panel
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    const target = e.target as HTMLElement;
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

  // event handler: mouse move over the viewer panel
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

  // event handler: mouse up on the viewer panel
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
      boundingBoxes.forEach(b => {
        const xs = b.Points.map(p => p.X); const ys = b.Points.map(p => p.Y);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        if (!(maxX < selectionRect.left || minX > selectionRect.right || maxY < selectionRect.top || minY > selectionRect.bottom)) ids.add(b.FieldId);
      });
      setSelectedFields(ids); cancelSelection();
    } else if (isClick && !isDragging && !isKeyActive) {
      const target = e.target as HTMLElement;
      if (!target.draggable && !target.closest('[data-field-id]') && !e.ctrlKey && !e.metaKey) {
        setSelectedFields(new Set());
        onBoundingBoxFocus?.(null);
      }
    }
    setIsDragging(false); setDraggedField(null);
  };

  // event handler: mouse leave on the viewer panel
  const handlePanelMouseLeave = () => {
    setIsDragging(false);
    setDraggedField(null);
    if (isAreaSelecting) {
      cancelSelection();
    }
  };

  const selectionRectBaseStyle = getSelectionRectStyle();
  const selectionRectStyle: CSSProperties = selectionRectBaseStyle.display === 'none'
    ? selectionRectBaseStyle
    : {
        ...selectionRectBaseStyle,
        position: 'absolute',
        border: '2px dashed #2196f3',
        backgroundColor: 'rgba(33,150,243,0.1)',
        pointerEvents: 'none',
        zIndex: 25,
      };

  const scaledWidth = baseSvgDims.width ? baseSvgDims.width * scale : undefined;
  const scaledHeight = baseSvgDims.height ? baseSvgDims.height * scale : undefined;

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary" fontStyle="italic">
          Loading document...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', gap: 2, p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" color="primary" variant="outlined" label={`${Math.round(scale * 100)}%`} />
          <Chip size="small" variant="outlined" label={`${boundingBoxes.length} fields detected`} />
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
          <Tooltip title="Zoom In (Alt + Wheel)">
            <IconButton color="primary" size="small" onClick={() => setScale(s => Math.min(5, s * 1.2))} aria-label="Zoom In">
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out (Alt + Wheel)">
            <IconButton color="primary" size="small" onClick={() => setScale(s => Math.max(0.1, s / 1.2))} aria-label="Zoom Out">
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset View">
            <IconButton color="primary" size="small" onClick={() => { resetView(); resetPan(); }} aria-label="Reset View">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={showOverlays ? 'Hide Field Overlays' : 'Show Field Overlays'}>
            <IconButton
              size="small"
              onClick={() => setShowOverlays(!showOverlays)}
              aria-label={showOverlays ? 'Hide Field Overlays' : 'Show Field Overlays'}
              color={showOverlays ? 'primary' : 'default'}
            >
              {showOverlays ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.paper',
          cursor: isKeyActive ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
        }}
        onMouseDown={handlePanelMouseDown}
        onMouseMove={handlePanelMouseMove}
        onMouseUp={handlePanelMouseUp}
        onMouseLeave={handlePanelMouseLeave}
      >
        {/** keep scaled size placeholder to prevent border clipping */}
        <Box
          ref={svgRef}
          sx={{
            position: 'relative',
            width: scaledWidth || 'auto',
            height: scaledHeight || 'auto',
            minWidth: scaledWidth || 'auto',
            minHeight: scaledHeight || 'auto',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: baseSvgDims.width || 'auto',
              height: baseSvgDims.height || 'auto',
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0s linear',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
            {showOverlays && boundingBoxes.map((boundingBox) => {
              const style = getBoundingBoxStyle(boundingBox);
              const isFocusedLinked = !!(boundingBox.generatedId && focusedInputLinkedBoxIds.has(boundingBox.generatedId));
              return (
                <Box
                  key={boundingBox.FieldId}
                  data-field-id={boundingBox.FieldId}
                  data-focused-linked={isFocusedLinked ? 'true' : undefined}
                  draggable
                  onDragStart={(e) => handleFieldDragStart(e, boundingBox)}
                  title={boundingBox.FieldText}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleFieldSelection(boundingBox.FieldId, e)}
                  style={style}
                />
              );
            })}
            <Box style={selectionRectStyle} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Viewer;