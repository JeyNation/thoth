import React from 'react';
import { TextField } from '@mui/material';
import ClearAdornment from './ClearAdornment';
import { applyDropHighlightSx } from '../../styles/dropHighlight';

export interface BasicFieldInputProps {
  id: string;
  value: string;
  kind: 'text' | 'textarea';
  multiline?: boolean;
  rows?: number;
  baseSx: Record<string, any>;
  isDropActive: boolean;
  ariaLabel: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const BasicFieldInput: React.FC<BasicFieldInputProps> = ({
  id,
  value,
  kind,
  multiline,
  rows,
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
  const showClear = value.trim() !== '';
  const sx = isDropActive ? applyDropHighlightSx(baseSx) : baseSx;

  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      value={value}
      multiline={multiline}
      minRows={rows}
      sx={sx}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      slotProps={{
        input: {
          endAdornment: showClear ? <ClearAdornment onClear={onClear} /> : undefined,
          inputProps: { 'data-field-kind': kind, title: ariaLabel, 'data-field-id': id },
        },
      }}
    />
  );
};

export default React.memo(BasicFieldInput);
