import React from 'react';
import '../Form.css';
import { LINE_ITEM_COLUMNS, humanizeColumnKey, type LineItemColumnKey } from '../../types/lineItemColumns';
import type { MultiFieldPair } from '../../types/mapping';

export interface ColumnMappingDialogProps {
  lineNumber: number;
  pairs: MultiFieldPair[];
  proposed: Record<string, LineItemColumnKey | ''>;
  onChange: (updates: Record<string, LineItemColumnKey | ''>) => void;
  onApply: () => void;
  onCancel: () => void;
}

const ColumnMappingDialog: React.FC<ColumnMappingDialogProps> = ({ lineNumber, pairs, proposed, onChange, onApply, onCancel }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby={`column-mapping-title-${lineNumber}`}>
      <div style={{ background: '#fff', padding: '18px 22px', borderRadius: '8px', width: '520px', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <h4 id={`column-mapping-title-${lineNumber}`} style={{ margin: '0 0 6px 0' }}>Map Fields To Columns (Row {lineNumber})</h4>
        <p style={{ fontSize: '12px', margin: '0 0 12px 0', color: '#555' }}>Review predicted column assignments. Adjust before applying.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ borderBottom: '1px solid #ccc', padding: '4px' }}>Source Text</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '4px' }}>Source ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '4px' }}>Column</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(pair => (
              <tr key={pair.boxId}>
                <td style={{ borderBottom: '1px solid #eee', padding: '4px', width: '20%', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pair.text}>{pair.text}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '4px', width: '50%', fontFamily: 'monospace', fontSize: '11px' }}>{pair.fieldId}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '4px', width: '30%' }}>
                  <select
                    className="po-input"
                    value={proposed[pair.fieldId]}
                    onChange={e => {
                      const value = e.target.value as '' | LineItemColumnKey;
                      onChange({ ...proposed, [pair.fieldId]: value });
                    }}
                  >
                    <option value="">None</option>
                    {LINE_ITEM_COLUMNS.map(col => (
                      <option key={col} value={col}>{humanizeColumnKey(col)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
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

export default ColumnMappingDialog;