import React from 'react';
import { TextField } from '@mui/material';
import ClearAdornment from './ClearAdornment';
import { applyDropHighlightSx } from '../../styles/dropHighlight';

export interface LineItemFieldProps {
  fieldId: string;
  lineNumber: number;
  field: 'sku' | 'description' | 'quantity' | 'unitPrice';
  kind: 'text' | 'textarea' | 'integer' | 'decimal';
  value: string | number;
  baseSx: Record<string, any>;
  isDropActive: boolean;
  ariaLabel: string;
  onChange: (value: string | number, opts?: { explicitClear?: boolean }) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const LineItemField: React.FC<LineItemFieldProps> = ({
  fieldId,
  lineNumber,
  field,
  kind,
  value,
  baseSx,
  isDropActive,
  ariaLabel,
  onChange,
  onClear,
  onFocus,
  onBlur,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const showClear = (kind === 'integer' || kind === 'decimal') ? value !== 0 : typeof value === 'string' && value.trim() !== '';
  const sx = isDropActive ? applyDropHighlightSx(baseSx) : baseSx;
  const type = (kind === 'integer' || kind === 'decimal') ? 'number' : 'text';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = event.target.value;
    if (kind === 'integer') {
      if (raw === '') {
        onChange(0, { explicitClear: true });
      } else {
        onChange(parseInt(raw, 10) || 0);
      }
      return;
    }
    if (kind === 'decimal') {
      if (raw === '') {
        onChange(0, { explicitClear: true });
      } else {
        onChange(parseFloat(raw) || 0);
      }
      return;
    }
    onChange(raw);
  };

  return (
    <TextField
      key={fieldId}
      fullWidth
      size="small"
      variant="outlined"
      value={value as string | number}
      type={type}
      aria-label={ariaLabel}
      multiline={kind === 'textarea'}
      minRows={kind === 'textarea' ? 2 : undefined}
      sx={sx}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      InputProps={{
        endAdornment: showClear ? <ClearAdornment onClear={onClear} /> : undefined,
        inputProps: {
          'data-field-kind': kind,
          'data-field-id': fieldId,
          ...(kind === 'integer' || kind === 'decimal'
            ? { min: 0, step: kind === 'decimal' ? 0.01 : 1, style: { textAlign: 'right' } }
            : {}),
        },
      }}
    />
  );
};

export default React.memo(LineItemField);
