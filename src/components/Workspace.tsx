'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import type { PurchaseOrder } from '../types/PurchaseOrder';
import type { BoundingBox } from '../types/mapping';
import { useMapping, MappingProvider } from '../context/MappingContext';
import Form from './Form';
import Viewer from './Viewer';
import Debugger from './Debugger';

/** Wrapper between document viewer and PO form */
const Workspace: React.FC = () => {
    // refs
    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(140);

    // states
    const [documentData, setDocumentData] = useState<any>(null);
    const [focusedInputField, setFocusedInputField] = useState<string | null>(null);
    const [focusedBoundingBoxId, setFocusedBoundingBoxId] = useState<string | null>(null);
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
    const [showConnectionsDebug, setShowConnectionsDebug] = useState(true);
    const [debuggerHeight, setDebuggerHeight] = useState<number>(140);

    // custom hooks
    const { updatePurchaseOrder, recomputeGeometry, undo, redo, canUndo, canRedo } = useMapping();
    
    // callback: mouse move for resizing the debug panel
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizingRef.current) {
            const dy = startYRef.current - e.clientY;
            const newHeight = Math.max(60, startHeightRef.current + dy); // no upper cap
            setDebuggerHeight(newHeight);
        }
    }, []);

    // callback: mouse up to stop resizing
    const handleMouseUp = useCallback(() => { 
    isResizingRef.current = false; 
    }, []);

    // state change: add/remove global mouse event listeners for resizing
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // state change: load sample document data on mount
    useEffect(() => {
        fetch('/data/sample_document_data.json')
            .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(setDocumentData)
            .catch(err => console.error('Failed loading document data', err));
    }, []);

    // state change: global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const meta = e.metaKey || e.ctrlKey;
            if (!meta) return;
            const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
            const isRedo = (e.key.toLowerCase() === 'y') || (e.key.toLowerCase() === 'z' && e.shiftKey);
            if (!isUndo && !isRedo) return;
            // Skip if focused element is text-editable (allow native editing undo there)
            const active = document.activeElement as HTMLElement | null;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                return; // allow native undo/redo in fields
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

    // event handler: purchase order update from form
    const handlePurchaseOrderUpdate = (updated: PurchaseOrder) => updatePurchaseOrder(updated);
    
    // event handler: form field focus
    const handleFieldFocus = (fieldId: string | null) => {
        setFocusedInputField(fieldId);
        // When focusing a form input (or clearing), drop the focused bounding box
        if (fieldId) {
            setFocusedBoundingBoxId(null);
        }
    };

    // event handler: bounding boxes update from viewer
    const handleBoundingBoxesUpdate = (boxes: BoundingBox[]) => {
        setBoundingBoxes(boxes); 
        recomputeGeometry(boxes);
    };

    // event handler: start resizing debugger panel
    const handleDebuggerResizerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        isResizingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = debuggerHeight;
    };

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
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <Viewer
                                documentData={documentData}
                                focusedInputField={focusedInputField}
                                onBoundingBoxesUpdate={handleBoundingBoxesUpdate}
                                onBoundingBoxFocus={setFocusedBoundingBoxId}
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
                        <Box sx={{ flex: 1, minHeight: 0 }}>
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
