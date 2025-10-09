'use client';

import React, { useCallback } from 'react';
import '../Form.css';
import { humanizeColumnKey } from '../../types/lineItemColumns';
import type { MultiFieldPair } from '../../types/mapping';
import type { LineItemColumnKey } from '../../types/lineItemColumns';

export interface RowMappingDialogProps {
  column: LineItemColumnKey;
  pairs: MultiFieldPair[];
  proposedRows: Record<string, number | null>;
  onChange: (updates: Record<string, number | null>) => void;
  onApply: () => void;
  onCancel: () => void;
}

const RowMappingDialog: React.FC<RowMappingDialogProps> = ({ column, pairs, proposedRows, onChange, onApply, onCancel }) => {
  // Helper to set a new numeric value (positive integer) or null.
  const setRowValue = useCallback((fieldId: string, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      onChange({ ...proposedRows, [fieldId]: null });
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      // Ignore invalid entry; do not update state.
      return;
    }
    onChange({ ...proposedRows, [fieldId]: parsed });
  }, [onChange, proposedRows]);

  const increment = (fieldId: string, current: number | null | undefined, delta: number) => {
    const next = Math.max(1, (current ?? 0) + delta);
    onChange({ ...proposedRows, [fieldId]: next });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby={`row-mapping-title-${column}`}>
      <div style={{ background: '#fff', padding: '18px 22px', borderRadius: '8px', width: '540px', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <h4 id={`row-mapping-title-${column}`} style={{ margin: '0 0 6px 0' }}>Assign Rows (Column {humanizeColumnKey(column)})</h4>
        <p style={{ fontSize: '12px', margin: '0 0 12px 0', color: '#555' }}>Select a target row for each source field.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ borderBottom: '1px solid #ccc', padding: '4px' }}>Source Text</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '4px' }}>Source ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '4px' }}>Row</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(pair => {
              const currentVal = proposedRows[pair.fieldId];
              return (
                <tr key={pair.boxId}>
                  <td style={{ borderBottom: '1px solid #eee', padding: '4px', width: '20%', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pair.text}>{pair.text}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '4px', width: '50%', fontFamily: 'monospace', fontSize: '11px' }}>{pair.fieldId}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '4px', width: '30%' }}>
                      <input
                        type="number"
                        min={1}
                        placeholder="None"
                        className="po-input"
                        value={currentVal == null ? '' : currentVal}
                        onChange={e => setRowValue(pair.fieldId, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'ArrowUp') { e.preventDefault(); increment(pair.fieldId, currentVal, 1); }
                          else if (e.key === 'ArrowDown') { e.preventDefault(); increment(pair.fieldId, currentVal, -1); }
                        }}
                      />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button type="button" onClick={onApply} className="btn btn-primary">Apply</button>
        </div>
      </div>
    </div>
  );
};

export default RowMappingDialog;
