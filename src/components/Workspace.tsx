'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import type { PurchaseOrder } from '../types/PurchaseOrder';
import type { BoundingBox } from '../types/mapping';
import { useMapping, MappingProvider } from '../context/MappingContext';
import Form from './Form';
import Viewer from './Viewer';
import Debugger from './Debugger';
import ConnectionOverlay, { type OverlayConnection } from './ConnectionOverlay';

/** Wrapper between document viewer and PO form */
const Workspace: React.FC = () => {
    const [documentData, setDocumentData] = useState<any>(null);
    const [focusedInputField, setFocusedInputField] = useState<string | null>(null);
    const [focusedBoundingBoxId, setFocusedBoundingBoxId] = useState<string | null>(null);
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
    const [showConnectionsDebug, setShowConnectionsDebug] = useState(true);
    const [debuggerHeight, setDebuggerHeight] = useState<number>(140);
    const [connections, setConnections] = useState<OverlayConnection[]>([]);
    const [overlaysVisible, setOverlaysVisible] = useState<boolean>(true);
    
    const { 
        updatePurchaseOrder, 
        recomputeGeometry, 
        undo, 
        redo,
        canUndo, 
        canRedo, 
        fieldSources, 
        reverseIndex, 
        updateFieldSources 
    } = useMapping();
    
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
            if (typeof CSS !== 'undefined' && typeof (CSS as any).escape === 'function') return (CSS as any).escape(value);
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
        const onScroll = () => recompute();
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll as any, { passive: true, capture: true } as any);
        document.addEventListener('scroll', onScroll as any, { passive: true, capture: true } as any);
        const ro = new ResizeObserver(() => recompute());
        document.querySelectorAll('[data-view-panel], [data-form-panel]').forEach((el) => ro.observe(el));
        if (scrollersRef.current.length === 0) {
            scrollersRef.current = Array.from(document.querySelectorAll('[data-scroll-listener]')) as HTMLElement[];
            scrollersRef.current.forEach((el) => el.addEventListener('scroll', onScroll, { passive: true } as any));
        }
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll as any, true);
            document.removeEventListener('scroll', onScroll as any, true);
            scrollersRef.current.forEach((el) => el.removeEventListener('scroll', onScroll as any));
            ro.disconnect();
            if (raf) cancelAnimationFrame(raf);
            recomputeRef.current = null;
        };
    }, [focusedInputField, focusedBoundingBoxId]);

    useEffect(() => {
        fetch('/data/sample_document_data.json')
            .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(setDocumentData)
            .catch(err => console.error('Failed loading document data', err));
    }, []);

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
        (document.body.style as any).userSelect = 'none';
        (document.body.style as any).webkitUserSelect = 'none';
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
            (document.body.style as any).userSelect = '';
            (document.body.style as any).webkitUserSelect = '';
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isResizingRef.current) return;
            const t = e.touches[0];
            if (!t) return;
            const deltaY = t.clientY - startYRef.current;
            const minH = 80;
            const maxH = Math.max(minH, Math.floor(window.innerHeight * 0.9));
            // invert delta so dragging up increases height
            const next = Math.min(maxH, Math.max(minH, startHeightRef.current - deltaY));
            setDebuggerHeight(next);
            e.preventDefault();
        };
        const onTouchEnd = () => {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            document.body.style.cursor = '';
            (document.body.style as any).userSelect = '';
            (document.body.style as any).webkitUserSelect = '';
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false } as any);
        window.addEventListener('touchend', onTouchEnd);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove as any, true as any);
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
    }, [focusedInputField, focusedBoundingBoxId, updateFieldSources]);

    const handleViewerTransformChange = useCallback((_scale: number, _pos: { x: number; y: number }) => {
        const fn = recomputeRef.current;
        if (fn) {
            requestAnimationFrame(() => fn());
        }
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 2 }}>
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        gap: 2,
                        position: 'relative',
                        alignItems: 'stretch',
                    }}
                >
                    {overlaysVisible && (
                        <ConnectionOverlay
                            connections={connections}
                            onCenterIconClick={handleCenterIconClick}
                            focusSource={focusedBoundingBoxId ? 'viewer' : (focusedInputField ? 'form' : undefined)}
                        />
                    )}
                    <Paper
                        elevation={1}
                        sx={{
                            minWidth: 0,
                            minHeight: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: 3,
                        }}
                    >
                        <Box sx={{ flex: 1, minHeight: 0 }} data-view-panel>
                            <Viewer
                                documentData={documentData}
                                focusedInputField={focusedInputField}
                                onBoundingBoxesUpdate={handleBoundingBoxesUpdate}
                                onViewerTransformChange={handleViewerTransformChange}
                                onBoundingBoxFocus={setFocusedBoundingBoxId}
                                onOverlaysVisibilityChange={setOverlaysVisible}
                            />
                        </Box>
                    </Paper>
                    <Paper
                        elevation={1}
                        sx={{
                            minWidth: 0,
                            minHeight: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: 3,
                        }}
                    >
                        <Box sx={{ flex: 1, minHeight: 0 }} data-form-panel>
                            <Form
                                onUpdate={handlePurchaseOrderUpdate}
                                onFieldFocus={handleFieldFocus}
                                focusedBoundingBoxId={focusedBoundingBoxId}
                            />
                        </Box>
                    </Paper>
                </Box>
                {!showConnectionsDebug && (
                    <Box
                        onClick={() => setShowConnectionsDebug(true)}
                        title="Show debug panel"
                        sx={{
                            alignSelf: 'flex-start',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(0,0,0,0.72)',
                            color: 'common.white',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                            userSelect: 'none',
                        }}
                    >
                        Show Debug
                    </Box>
                )}
            </Box>
            {showConnectionsDebug && (
                <>
                    <Box
                        onMouseDown={handleDebuggerResizerMouseDown}
                        title="Drag to resize"
                        sx={{
                            height: 6,
                            flexShrink: 0,
                            background: 'linear-gradient(180deg,#d0d0d0,#b5b5b5)',
                            boxShadow: 'inset 0 0 3px rgba(153,153,153,0.75)',
                            cursor: 'row-resize',
                            borderRadius: 99,
                            userSelect: 'none',
                        }}
                    />
                    <Box
                        sx={{
                            height: debuggerHeight,
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'rgba(17,24,39,0.92)',
                            color: 'rgba(255,255,255,0.92)',
                            fontSize: '0.75rem',
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 -6px 16px rgba(15,23,42,0.55)',
                        }}
                    >
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

const WorkspaceWithProvider: React.FC = () => (
    <MappingProvider>
        <Workspace />
    </MappingProvider>
);

export default WorkspaceWithProvider;
