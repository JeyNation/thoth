'use client';

import { Box, Paper } from '@mui/material';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import ConnectionOverlay, { type OverlayConnection } from './ConnectionOverlay';
import Debugger from './Debugger';
import Form from './Form';
import { Rules } from './Rules';
import Viewer from './Viewer';
import { WorkspaceMenu } from './workspace/WorkspaceMenu';
import { WorkspaceTabs } from './workspace/WorkspaceTabs';
import { EXTRACTION_FIELD_MAPPING } from '../config/formFields';
import { useMapping, MappingProvider } from '../context/MappingContext';
import { ExtractionEngine } from '../services/extractionEngine';
import {
    WORKSPACE_ROOT_SX,
    WORKSPACE_INNER_SX,
    WORKSPACE_GRID_SX,
    WORKSPACE_PANEL_PAPER_SX,
    WORKSPACE_PANEL_BOX_SX,
    WORKSPACE_SHOW_DEBUG_BUTTON_SX,
    WORKSPACE_DEBUG_RESIZER_SX,
    WORKSPACE_DEBUG_CONTAINER_SX,
} from '../styles/workspaceStyles';
import type { BoundingBox as ExtractionBoundingBox } from '../types/boundingBox';
import type { LayoutMap } from '../types/extractionRules';
import type { BoundingBox } from '../types/mapping';
import type { PurchaseOrder } from '../types/PurchaseOrder';

interface WorkspaceProps {
    documentPath: string;
    onBackToList: () => void;
}

type DocumentData = Record<string, unknown> & { vendorId?: string };

const STORAGE_KEY_PREFIX = 'thoth:layoutMap:';

const getStorageKey = (vendorId: string) => `${STORAGE_KEY_PREFIX}${vendorId}`;

const readLayoutMapFromStorage = (vendorId: string): LayoutMap | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(getStorageKey(vendorId));
        if (!raw) return null;
        return JSON.parse(raw) as LayoutMap;
    } catch (error) {
        console.warn('Failed to read layout map from localStorage', error);
        return null;
    }
};

const Workspace: React.FC<WorkspaceProps> = ({ documentPath, onBackToList }) => {
    const [documentData, setDocumentData] = useState<DocumentData | null>(null);
    const [focusedInputField, setFocusedInputField] = useState<string | null>(null);
    const [focusedBoundingBoxId, setFocusedBoundingBoxId] = useState<string | null>(null);
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
    const [showConnectionsDebug, setShowConnectionsDebug] = useState(true);
    const [debuggerHeight, setDebuggerHeight] = useState<number>(140);
    const [connections, setConnections] = useState<OverlayConnection[]>([]);
    const [overlaysVisible, setOverlaysVisible] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [hasRunAutoExtraction, setHasRunAutoExtraction] = useState(false);
    const layoutMapCacheRef = useRef<{ vendorId: string; layoutMap: LayoutMap } | null>(null);
    
    const { 
        purchaseOrder,
        updatePurchaseOrder, 
        recomputeGeometry, 
        undo, 
        redo,
        canUndo, 
        canRedo, 
        fieldSources, 
        reverseIndex, 
        updateFieldSources,
        replaceAll,
        applyTransaction
    } = useMapping();
    
    const getLayoutMapForVendor = useCallback(async (vendorId: string): Promise<LayoutMap | null> => {
        const stored = readLayoutMapFromStorage(vendorId);
        if (stored) {
            layoutMapCacheRef.current = { vendorId, layoutMap: stored };
            return stored;
        }

        if (layoutMapCacheRef.current && layoutMapCacheRef.current.vendorId === vendorId) {
            return layoutMapCacheRef.current.layoutMap;
        }

        try {
            const response = await fetch(`/data/layout_maps/${vendorId}_rules.json?t=${Date.now()}`);
            if (!response.ok) {
                return null;
            }
            const data: LayoutMap = await response.json();
            layoutMapCacheRef.current = { vendorId, layoutMap: data };
            return data;
        } catch (error) {
            console.error('Failed to load layout map for vendor', vendorId, error);
            return null;
        }
    }, []);

    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(140);
    const fieldSourcesRef = useRef(fieldSources);
    const reverseIndexRef = useRef(reverseIndex);
    const fieldElCacheRef = useRef<Map<string, HTMLElement>>(new Map());
    const boxElCacheRef = useRef<Map<string, HTMLElement>>(new Map());
    const scrollersRef = useRef<HTMLElement[]>([]);
    const recomputeRef = useRef<null | (() => void)>(null);

    useEffect(() => { fieldSourcesRef.current = fieldSources; }, [fieldSources]);
    useEffect(() => { reverseIndexRef.current = reverseIndex; }, [reverseIndex]);
    useEffect(() => {
        const cssEscape = (value: string) => {
            const cssAny = (CSS as unknown as { escape?: (s: string) => string });
            if (typeof cssAny?.escape === 'function') return cssAny.escape(value);
            return value.replace(/[^a-zA-Z0-9_\-]/g, (ch) => `\\${ch}`);
        };
        const ensureInDom = (el?: HTMLElement | null) => !!(el && document.contains(el));
        const getFieldEl = (id: string): HTMLElement | null => {
            const cache = fieldElCacheRef.current;
            const cached = cache.get(id);
            if (ensureInDom(cached)) return cached as HTMLElement;
            if (cached) cache.delete(id);
            const inputEl = document.querySelector(`[data-field-id="${cssEscape(id)}"]`) as HTMLElement | null;
            const wrapper = (inputEl?.closest?.('.MuiInputBase-root') as HTMLElement | null) || inputEl;
            if (wrapper) cache.set(id, wrapper as HTMLElement);
            return wrapper as HTMLElement | null;
        };
        const getBoxEl = (id: string): HTMLElement | null => {
            const cache = boxElCacheRef.current;
            const cached = cache.get(id);
            if (ensureInDom(cached)) return cached as HTMLElement;
            if (cached) cache.delete(id);
            const el = document.querySelector(`[data-box-id="${cssEscape(id)}"]`) as HTMLElement | null;
            if (el) cache.set(id, el as HTMLElement);
            return el as HTMLElement | null;
        };
        const rectOfEl = (el: HTMLElement | null) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        };
        let raf = 0; let pending = false;
        const recomputeNow = () => {
            const next: OverlayConnection[] = [];
            const svgContainer = document.querySelector('[data-svg-container]') as HTMLElement | null;
            const viewPanel = document.querySelector('[data-view-panel]') as HTMLElement | null;
            const formPanel = document.querySelector('[data-form-panel]') as HTMLElement | null;
            const viewContainer = rectOfEl(svgContainer) || rectOfEl(viewPanel);
            const formContainer = rectOfEl(formPanel);
            type Rect = { left: number; top: number; right: number; bottom: number };
            const clampRectTo = (
                rect: Rect | null,
                container: Rect | null
            ): { rect: Rect | null; clamped: boolean; sides: { left: boolean; right: boolean; top: boolean; bottom: boolean }; out: { left: boolean; right: boolean; top: boolean; bottom: boolean } } => {
                if (!rect || !container) return { rect, clamped: false, sides: { left: false, right: false, top: false, bottom: false }, out: { left: false, right: false, top: false, bottom: false } };
                const out = {
                    left: rect.left < container.left,
                    right: rect.right > container.right,
                    top: rect.top < container.top,
                    bottom: rect.bottom > container.bottom,
                };
                const intersectLeft = Math.max(rect.left, container.left);
                const intersectTop = Math.max(rect.top, container.top);
                const intersectRight = Math.min(rect.right, container.right);
                const intersectBottom = Math.min(rect.bottom, container.bottom);
                const hasOverlap = intersectRight > intersectLeft && intersectBottom > intersectTop;
                const left = Math.min(Math.max(rect.left, container.left), container.right);
                const right = Math.min(Math.max(rect.right, container.left), container.right);
                const top = Math.min(Math.max(rect.top, container.top), container.bottom);
                const bottom = Math.min(Math.max(rect.bottom, container.top), container.bottom);
                const sides = {
                    left: left !== rect.left,
                    right: right !== rect.right,
                    top: top !== rect.top,
                    bottom: bottom !== rect.bottom,
                };
                const clamped = !hasOverlap;
                return { rect: { left, top, right, bottom }, clamped, sides, out };
            };
            if (focusedInputField) {
                const aEl = getFieldEl(focusedInputField);
                const aClamp = clampRectTo(rectOfEl(aEl), formContainer);
                const src = fieldSourcesRef.current?.[focusedInputField];
                if (aClamp.rect && src && Array.isArray(src.ids)) {
                    for (const id of src.ids) {
                        const bClamp = clampRectTo(rectOfEl(getBoxEl(id)), viewContainer);
                        if (bClamp.rect) next.push({
                            fieldId: focusedInputField,
                            boxId: id,
                            a: aClamp.rect,
                            b: bClamp.rect,
                            aClamped: aClamp.clamped,
                            bClamped: bClamp.clamped,
                            aClampSides: aClamp.sides,
                            bClampSides: bClamp.sides,
                            aOut: aClamp.out,
                            bOut: bClamp.out,
                            aSide: 'form',
                            bSide: 'view',
                        });
                    }
                }
            }
            if (!focusedInputField && focusedBoundingBoxId) {
                const aEl = getBoxEl(focusedBoundingBoxId);
                const aClamp = clampRectTo(rectOfEl(aEl), viewContainer);
                const inputs = reverseIndexRef.current?.[focusedBoundingBoxId] || [];
                if (aClamp.rect && inputs && inputs.length) {
                    for (const fid of inputs) {
                        const bClamp = clampRectTo(rectOfEl(getFieldEl(fid)), formContainer);
                        if (bClamp.rect) next.push({
                            fieldId: fid,
                            boxId: focusedBoundingBoxId,
                            a: aClamp.rect,
                            b: bClamp.rect,
                            aClamped: aClamp.clamped,
                            bClamped: bClamp.clamped,
                            aClampSides: aClamp.sides,
                            bClampSides: bClamp.sides,
                            aOut: aClamp.out,
                            bOut: bClamp.out,
                            aSide: 'view',
                            bSide: 'form',
                        });
                    }
                }
            }
            setConnections(next);
        };

    const recompute = () => { if (pending) return; pending = true; raf = requestAnimationFrame(() => { pending = false; recomputeNow(); }); };
    
    recomputeRef.current = recompute;
    recompute(); requestAnimationFrame(recompute);
    const onResize = () => recompute();
    const onScroll = (_e?: Event) => recompute();
    const scrollOpts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, scrollOpts);
    document.addEventListener('scroll', onScroll, scrollOpts);
        const ro = new ResizeObserver(() => recompute());
        document.querySelectorAll('[data-view-panel], [data-form-panel]').forEach((el) => ro.observe(el));
        if (scrollersRef.current.length === 0) {
            scrollersRef.current = Array.from(document.querySelectorAll('[data-scroll-listener]')) as HTMLElement[];
            scrollersRef.current.forEach((el) => el.addEventListener('scroll', onScroll, { passive: true }));
        }
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll as EventListener, true);
            document.removeEventListener('scroll', onScroll as EventListener, true);
            scrollersRef.current.forEach((el) => el.removeEventListener('scroll', onScroll));
            ro.disconnect();
            if (raf) cancelAnimationFrame(raf);
            recomputeRef.current = null;
        };
    }, [focusedInputField, focusedBoundingBoxId]);

    useEffect(() => {
        if (!documentPath) return;
        
        // Reset auto-extraction flag when document changes
        setHasRunAutoExtraction(false);
        
        fetch(documentPath)
            .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then((d) => setDocumentData(d as DocumentData))
            .catch(err => console.error('Failed loading document data', err));
    }, [documentPath]);

    // Auto-extract fields when document and bounding boxes are loaded (only once)
    useEffect(() => {
        if (!documentData || !documentData.vendorId || boundingBoxes.length === 0 || hasRunAutoExtraction) return;

        const runAutoExtraction = async () => {
            try {
                const vendorId = documentData.vendorId as string;
                const layoutMap = await getLayoutMapForVendor(vendorId);
                if (!layoutMap) {
                    return;
                }
                
                // Convert mapping BoundingBox to extraction BoundingBox format
                const extractionBoxes: ExtractionBoundingBox[] = boundingBoxes.map(box => ({
                    id: box.id,
                    fieldId: box.fieldId,
                    fieldText: box.fieldText,
                    page: box.page,
                    points: box.points
                }));

                // Run extraction
                const engine = new ExtractionEngine(extractionBoxes, layoutMap);
                const result = engine.extract();

                // Apply extractions to form
                if (result.extractions.length > 0) {
                    const mappingUpdates: Array<{ fieldId: string; sourceIds: string[] }> = [];
                    const updatedPO = { ...purchaseOrder };

                    result.extractions.forEach(extraction => {
                        // Collect all source field IDs from segments (these are OCR field IDs like "field_123")
                        const allSourceFieldIds = extraction.segments.flatMap(seg => seg.sourceFieldIds);
                        
                        // Find the corresponding bounding box IDs (like "bbox-field_123-0")
                        const boundingBoxIds = boundingBoxes
                            .filter(box => allSourceFieldIds.includes(box.fieldId))
                            .map(box => box.id);
                        
                        // Use the centralized mapping to convert extraction field IDs to purchase order field IDs
                        const poFieldId = EXTRACTION_FIELD_MAPPING[extraction.extractionFieldId] || extraction.extractionFieldId;
                        
                        // Add to mapping updates (use bounding box IDs, not OCR field IDs)
                        mappingUpdates.push({
                            fieldId: poFieldId,
                            sourceIds: boundingBoxIds
                        });

                        // Update the purchase order value
                        (updatedPO as Record<string, unknown>)[poFieldId] = extraction.value;
                    });

                    // Apply both mapping and purchase order updates in a single transaction
                    // This will link the bounding boxes to the form field
                    applyTransaction({
                        mappingUpdates,
                        purchaseOrder: updatedPO,
                        boundingBoxes // Pass all bounding boxes for geometry computation
                    });
                    
                    // Mark auto-extraction as complete to prevent re-running
                    setHasRunAutoExtraction(true);
                }
            } catch (error) {
                console.error('Auto-extraction failed:', error);
            }
        };

        runAutoExtraction();
    }, [documentData, boundingBoxes, hasRunAutoExtraction, applyTransaction, getLayoutMapForVendor, purchaseOrder]);

    useEffect(() => {
        const fn = recomputeRef.current;
        if (fn) {
            requestAnimationFrame(() => fn());
        }
    }, [fieldSources, reverseIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const meta = e.metaKey || e.ctrlKey;
            if (!meta) return;
            const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
            const isRedo = (e.key.toLowerCase() === 'y') || (e.key.toLowerCase() === 'z' && e.shiftKey);
            if (!isUndo && !isRedo) return;
            const active = document.activeElement as HTMLElement | null;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                return;
            }
            if (isUndo) {
                if (canUndo) { e.preventDefault(); undo(); }
            } else if (isRedo) {
                if (canRedo) { e.preventDefault(); redo(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    const handlePurchaseOrderUpdate = (updated: PurchaseOrder) => updatePurchaseOrder(updated);
    
    const handleRerunExtraction = async () => {
        if (!documentData || !documentData.vendorId || boundingBoxes.length === 0) {
            return;
        }

        try {
                const vendorId = documentData.vendorId as string;
                const layoutMap = await getLayoutMapForVendor(vendorId);
            if (!layoutMap) {
                alert('No layout rules found for this vendor');
                return;
            }
            
            // Convert mapping BoundingBox to extraction BoundingBox format
            const extractionBoxes: ExtractionBoundingBox[] = boundingBoxes.map(box => ({
                id: box.id,
                fieldId: box.fieldId,
                fieldText: box.fieldText,
                page: box.page,
                points: box.points
            }));

            // Run extraction
            const engine = new ExtractionEngine(extractionBoxes, layoutMap);
            const result = engine.extract();

            // Clear all existing mappings and reset purchase order
            replaceAll({});
            const clearedPO: PurchaseOrder = { 
                documentNumber: '', 
                customerNumber: '', 
                documentDate: '', 
                shipToAddress: '', 
                lineItems: [] 
            };

            // Apply extractions to form
            if (result.extractions.length > 0) {
                const mappingUpdates: Array<{ fieldId: string; sourceIds: string[] }> = [];
                const updatedPO = { ...clearedPO };

                result.extractions.forEach(extraction => {
                    // Collect all source field IDs from segments (these are OCR field IDs like "field_123")
                    const allSourceFieldIds = extraction.segments.flatMap(seg => seg.sourceFieldIds);
                    
                    // Find the corresponding bounding box IDs (like "bbox-field_123-0")
                    const boundingBoxIds = boundingBoxes
                        .filter(box => allSourceFieldIds.includes(box.fieldId))
                        .map(box => box.id);
                    
                    // Use the centralized mapping to convert extraction field IDs to purchase order field IDs
                    const poFieldId = EXTRACTION_FIELD_MAPPING[extraction.extractionFieldId] || extraction.extractionFieldId;
                    
                    // Add to mapping updates (use bounding box IDs, not OCR field IDs)
                    mappingUpdates.push({
                        fieldId: poFieldId,
                        sourceIds: boundingBoxIds
                    });

                    // Update the purchase order value
                    (updatedPO as Record<string, unknown>)[poFieldId] = extraction.value;
                });

                // Apply both mapping and purchase order updates in a single transaction
                applyTransaction({
                    mappingUpdates,
                    purchaseOrder: updatedPO,
                    boundingBoxes
                });
            } else {
                // No extractions, just update with cleared PO
                updatePurchaseOrder(clearedPO);
            }
        } catch (error) {
            console.error('Rerun extraction failed:', error);
            alert(`Failed to rerun extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    
    const handleFieldFocus = (fieldId: string | null) => {
        setFocusedInputField(fieldId);
        if (fieldId) {
            setFocusedBoundingBoxId(null);
        }
    };

    const handleBoundingBoxesUpdate = useCallback((boxes: BoundingBox[]) => {
        setBoundingBoxes(boxes);
        recomputeGeometry(boxes);
    }, [recomputeGeometry]);

    const handleDebuggerResizerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = debuggerHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    (document.body.style as unknown as { webkitUserSelect?: string }).webkitUserSelect = 'none';
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const deltaY = e.clientY - startYRef.current;
            const minH = 80;
            const maxH = Math.max(minH, Math.floor(window.innerHeight * 0.9));
            const next = Math.min(maxH, Math.max(minH, startHeightRef.current - deltaY));
            setDebuggerHeight(next);
            e.preventDefault();
        };
        const onMouseUp = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            e.preventDefault();
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            (document.body.style as unknown as { webkitUserSelect?: string }).webkitUserSelect = '';
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isResizingRef.current) return;
            const t = e.touches[0];
            if (!t) return;
            const deltaY = t.clientY - startYRef.current;
            const minH = 80;
            const maxH = Math.max(minH, Math.floor(window.innerHeight * 0.9));
            const next = Math.min(maxH, Math.max(minH, startHeightRef.current - deltaY));
            setDebuggerHeight(next);
            e.preventDefault();
        };
        const onTouchEnd = () => {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            (document.body.style as unknown as { webkitUserSelect?: string }).webkitUserSelect = '';
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove as EventListener, true);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, []);

    const handleCenterIconClick = useCallback((conn: OverlayConnection, index: number) => {
        const fieldId = conn.fieldId;
        const boxId = conn.boxId;
        if (!fieldId || !boxId) return;
        const current = fieldSourcesRef.current?.[fieldId]?.ids || [];
        const next = current.filter(id => id !== boxId);
        updateFieldSources(fieldId, next.length ? next : null, undefined);
        setConnections(prev => prev.filter((c, i) => i !== index && !(c.fieldId === fieldId && c.boxId === boxId)));
        if (focusedInputField === fieldId && next.length === 0) {
            setFocusedInputField(null);
        }
    }, [focusedInputField, updateFieldSources]);

    const handleViewerTransformChange = useCallback((_scale: number, _pos: { x: number; y: number }) => {
        const fn = recomputeRef.current;
        if (fn) {
            requestAnimationFrame(() => fn());
        }
    }, []);

    const handleBackToListClick = () => {
        // Reset all state when going back to document list
        setConnections([]);
        setFocusedInputField(null);
        setFocusedBoundingBoxId(null);
        replaceAll({}); // Clear all field mappings
        updatePurchaseOrder({ documentNumber: '', customerNumber: '', documentDate: '', shipToAddress: '', lineItems: [] }); // Reset purchase order
        setDocumentData(null);
        layoutMapCacheRef.current = null; // Clear the cache
        onBackToList();
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={WORKSPACE_ROOT_SX}>
            <Box sx={WORKSPACE_INNER_SX}>
                <WorkspaceMenu onBackToDocuments={handleBackToListClick} />
                <Box sx={WORKSPACE_GRID_SX}>
                    {overlaysVisible && (
                        <ConnectionOverlay
                            connections={connections}
                            onCenterIconClick={handleCenterIconClick}
                            focusSource={focusedBoundingBoxId ? 'viewer' : (focusedInputField ? 'form' : undefined)}
                        />
                    )}
                    <Paper elevation={1} sx={WORKSPACE_PANEL_PAPER_SX}>
                        <Box sx={WORKSPACE_PANEL_BOX_SX} data-view-panel>
                            <Viewer
                                svgImages={documentData?.svgImages as string[] | undefined}
                                boundingBoxes={documentData?.boundingBoxes as BoundingBox[] | undefined}
                                focusedInputField={focusedInputField}
                                onBoundingBoxesUpdate={handleBoundingBoxesUpdate}
                                onViewerTransformChange={handleViewerTransformChange}
                                onBoundingBoxFocus={setFocusedBoundingBoxId}
                                onOverlaysVisibilityChange={setOverlaysVisible}
                            />
                        </Box>
                    </Paper>
                    <Paper elevation={1} sx={WORKSPACE_PANEL_PAPER_SX}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <WorkspaceTabs value={activeTab} onChange={handleTabChange} />
                            <Box sx={{ flex: 1, overflow: 'hidden' }} data-form-panel>
                                {activeTab === 0 && (
                                    <Form
                                        onUpdate={handlePurchaseOrderUpdate}
                                        onFieldFocus={handleFieldFocus}
                                        focusedBoundingBoxId={focusedBoundingBoxId}
                                    />
                                )}
                                {activeTab === 1 && (
                                    <Rules vendorId={documentData?.vendorId} onRerunExtraction={handleRerunExtraction} />
                                )}
                            </Box>
                        </Box>
                    </Paper>
                </Box>
                {!showConnectionsDebug && (
                    <Box onClick={() => setShowConnectionsDebug(true)} title="Show debug panel" sx={WORKSPACE_SHOW_DEBUG_BUTTON_SX}>
                        Show Debug
                    </Box>
                )}
            </Box>
            {showConnectionsDebug && (
                <>
                    <Box onMouseDown={handleDebuggerResizerMouseDown} title="Drag to resize" sx={WORKSPACE_DEBUG_RESIZER_SX} />
                    <Box sx={WORKSPACE_DEBUG_CONTAINER_SX(debuggerHeight)}>
                        <Debugger
                            boundingBoxes={boundingBoxes}
                            focusedInputField={focusedInputField}
                            focusedBoundingBoxId={focusedBoundingBoxId}
                            onHide={() => setShowConnectionsDebug(false)}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};

const WorkspaceWithProvider: React.FC<WorkspaceProps> = ({ documentPath, onBackToList }) => (
    <MappingProvider>
        <Workspace documentPath={documentPath} onBackToList={onBackToList} />
    </MappingProvider>
);

export default WorkspaceWithProvider;
