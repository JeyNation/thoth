'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PurchaseOrder } from '../types/PurchaseOrder';
import type { BoundingBox } from '../types/mapping';
import { useMapping, MappingProvider } from '../context/MappingContext';
import Form from './Form';
import Viewer from './Viewer';
import Debugger from './Debugger';
import './Debugger.css';
import './Workspace.css';

/** Wrapper between document viewer and PO form */
const Workspace: React.FC = () => {
    // refs
    const isHorizontalResizingRef = useRef(false);
    const containerRectRef = useRef<DOMRect | null>(null);
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
            let newHeight = Math.min(400, Math.max(60, startHeightRef.current + dy));
            setDebuggerHeight(newHeight);
        }
    }, []);

    // callback: mouse up to stop resizing
    const handleMouseUp = useCallback(() => { 
        isResizingRef.current = false; 
        isHorizontalResizingRef.current = false; 
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
        <div className="workspace-root">
            <div className="workspace-main">
                <div className="panel-container" ref={el => { if (el) containerRectRef.current = el.getBoundingClientRect(); }}>
                    <div className="left-panel" style={{ width: `50%` }}>
                        <Viewer
                            documentData={documentData}
                            focusedInputField={focusedInputField}
                            onBoundingBoxesUpdate={handleBoundingBoxesUpdate}
                            onBoundingBoxFocus={setFocusedBoundingBoxId}
                        />
                    </div>
                    <div className="right-panel">
                        <Form
                            onUpdate={handlePurchaseOrderUpdate}
                            onFieldFocus={handleFieldFocus}
                            focusedBoundingBoxId={focusedBoundingBoxId}
                        />
                    </div>
                </div>
                {!showConnectionsDebug && (
                    <div
                        className="viewer-debug-hidden-toggle"
                        onClick={() => setShowConnectionsDebug(true)}
                        title="Show debug panel"
                    >
                        Show Debug
                    </div>
                )}
            </div>
            {showConnectionsDebug && (
                <>
                    <div onMouseDown={handleDebuggerResizerMouseDown}
                        className="workspace-debugger-resizer"
                        title="Drag to resize">
                    </div>
                    <div className="workspace-debugger-shell" style={{ height: debuggerHeight }}>
                        <Debugger
                            boundingBoxes={boundingBoxes}
                            focusedInputField={focusedInputField}
                            focusedBoundingBoxId={focusedBoundingBoxId}
                            onHide={() => setShowConnectionsDebug(false)}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

const WorkspaceWithProvider: React.FC = () => (
    <MappingProvider>
        <Workspace />
    </MappingProvider>
);

export default WorkspaceWithProvider;
