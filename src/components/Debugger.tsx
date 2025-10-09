import React from 'react';
import EyeOffIcon from '../ui/icons/EyeOffIcon';
import type { BoundingBox } from '../types/mapping';
import { useMapping } from '../context/MappingContext';

interface DebuggerProps {
    boundingBoxes: BoundingBox[];
    focusedInputField: string | null;
    focusedBoundingBoxId?: string | null;
    onHide: () => void;
}

const Debugger: React.FC<DebuggerProps> = ({ boundingBoxes, focusedInputField, focusedBoundingBoxId, onHide }) => {
    const { fieldSources } = useMapping();
    const linkedFormFieldsForFocusedBox: string[] = focusedBoundingBoxId
        ? Object.entries(fieldSources)
            .filter(([, entry]) => entry.ids.includes(focusedBoundingBoxId))
            .map(([fid]) => fid)
        : [];
    
    const focusedBox = focusedBoundingBoxId
        ? boundingBoxes.find(b => b.generatedId === focusedBoundingBoxId)
        : null;
    
    return (
        <div className="workspace-debugger-content" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <div className="viewer-debug-header">
                <strong className="viewer-debug-header-title">Connections Debug</strong>
                <div className="viewer-debug-header-spacer" />
            </div>
            <button
                type="button"
                className="workspace-debugger-hide-btn"
                aria-label="Hide debug panel"
                title="Hide debug panel"
                onClick={onHide}
            >
                <EyeOffIcon size={17} />
            </button>
            <div className="viewer-debug-grid">
                <div><span className="label-dim">Boxes: </span><span>{boundingBoxes.length}</span></div>
                <div><span className="label-dim">Focused Input: </span><span>{focusedInputField || 'none'}</span></div>
                <div><span className="label-dim">Focused Box: </span><span>{focusedBoundingBoxId || 'none'}</span></div>
                <div><span className="label-dim">Sources: </span><span className="breakall">{JSON.stringify(fieldSources)}</span></div>
                {focusedBox && (
                    <div className="workspace-linked-sources-section">
                        {linkedFormFieldsForFocusedBox.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                                <div className="workspace-linked-sources-label">LINKED FORM INPUTS</div>
                                {linkedFormFieldsForFocusedBox.map(fid => (
                                    <div key={fid} className="workspace-linked-source-line" title={fid}>{fid}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {focusedInputField && fieldSources[focusedInputField] && fieldSources[focusedInputField].ids.length > 0 && (
                <div className="workspace-linked-sources-section">
                    <div className="workspace-linked-sources-label" style={{ marginTop: '6px' }}>GEOMETRY</div>
                    {fieldSources[focusedInputField].boxes.map(b => (
                        <div key={b.id} className="workspace-linked-source-line" title={b.id}>{b.id} [L{b.left} T{b.top} R{b.right} B{b.bottom}]</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Debugger;
