import React, { useEffect, useState } from 'react';
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
  // Use type="number" for integer, and type="text" for decimal to preserve trailing zeros visually
  const type = kind === 'integer' ? 'number' : (kind === 'decimal' ? 'text' : 'text');

  // Local display state for numeric inputs to preserve trailing zeros while typing
  const isNumeric = kind === 'integer' || kind === 'decimal';
  const [display, setDisplay] = useState<string>(() => (isNumeric ? String(value ?? 0) : ''));
  const [isFocused, setIsFocused] = useState(false);

  // Sync display from external value when not focused (e.g., programmatic updates)
  useEffect(() => {
    if (!isNumeric) return;
    if (!isFocused) {
      const parentNum = typeof value === 'number' ? value : (kind === 'integer' ? parseInt(String(value || '0'), 10) || 0 : parseFloat(String(value || '0')) || 0);
      const displayNum = (kind === 'integer') ? (parseInt(display || '0', 10) || 0) : (parseFloat(display || '0') || 0);
      if (displayNum !== parentNum) {
        setDisplay(String(value ?? 0));
      }
    }
  }, [value, isFocused, isNumeric, kind, display]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = event.target.value;
    if (kind === 'integer') {
      if (raw === '') {
        setDisplay(raw);
        onChange(0, { explicitClear: true });
      } else {
        setDisplay(raw);
        onChange(parseInt(raw, 10) || 0);
      }
      return;
    }
    if (kind === 'decimal') {
      // Allow only digits and a single '.'; empty string is allowed while typing
      const valid = raw === '' || /^\d*(\.\d*)?$/.test(raw);
      if (!valid) {
        // reject invalid change (ignore)
        return;
      }
      setDisplay(raw);
      if (raw === '' || raw === '.') {
        onChange(0, { explicitClear: true });
      } else {
        onChange(parseFloat(raw) || 0);
      }
      return;
    }
    onChange(raw);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (kind === 'integer' || kind === 'decimal') {
      const raw = event.target.value;
      if (raw !== '') {
        let normalizedStr: string;
        if (kind === 'integer') {
          // strip leading zeros, keep at least '0'
          normalizedStr = raw.replace(/^0+(?=\d)/, '').trim();
          if (normalizedStr === '') normalizedStr = '0';
          setDisplay(normalizedStr);
          const normalizedNum = parseInt(normalizedStr, 10) || 0;
          if (normalizedNum !== value) onChange(normalizedNum);
        } else {
          // decimal: strip leading zeros on the integer part, preserve fractional part exactly
          const dot = raw.indexOf('.');
          if (dot >= 0) {
            let intPart = raw.slice(0, dot);
            const fracPart = raw.slice(dot + 1); // keep as-is, including trailing zeros
            intPart = intPart.replace(/^0+(?=\d)/, '');
            if (intPart === '') intPart = '0';
            normalizedStr = `${intPart}.${fracPart}`;
          } else {
            // no decimal point, just strip leading zeros
            normalizedStr = raw.replace(/^0+(?=\d)/, '');
            if (normalizedStr === '') normalizedStr = '0';
          }
          setDisplay(normalizedStr);
          const normalizedNum = parseFloat(normalizedStr) || 0;
          if (normalizedNum !== value) onChange(normalizedNum);
        }
      }
    }
    setIsFocused(false);
    onBlur();
  };

  const handleFocus = () => { setIsFocused(true); onFocus(); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (kind !== 'decimal') return;
    const key = e.key;
    // Allow control/meta combos (copy/paste/select all/undo/redo)
    if (e.ctrlKey || e.metaKey) return;
    // Allow navigation/editing keys
    const nav = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab','Enter','Escape'];
    if (nav.includes(key)) return;
    // Allow digits
    if (key >= '0' && key <= '9') return;
    // Allow a single '.'
    if (key === '.') {
      if (display.includes('.')) e.preventDefault();
      return;
    }
    // Block everything else (e.g., space, letters, minus, comma)
    e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (kind !== 'decimal') return;
    const text = e.clipboardData.getData('text');
    // Sanitize pasted content to digits and a single '.'
    let cleaned = text.replace(/[^0-9.]/g, '');
    if (display.includes('.')) {
      // If we already have a dot, drop any dots from paste
      cleaned = cleaned.replace(/\./g, '');
    } else {
      // Keep only first dot in the pasted string
      const firstDot = cleaned.indexOf('.');
      if (firstDot !== -1) cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    // If resulting cleaned string would be empty and original had invalid chars only, prevent paste
    if (cleaned.length === 0) {
      e.preventDefault();
    }
    // Otherwise let the default paste happen; handleChange will re-validate via regex
  };

  return (
    <TextField
      key={fieldId}
      fullWidth
      size="small"
      variant="outlined"
      value={isNumeric ? display : (value as string)}
      type={type}
      aria-label={ariaLabel}
      multiline={kind === 'textarea'}
      minRows={kind === 'textarea' ? 2 : undefined}
      sx={sx}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      slotProps={{
        input: {
          endAdornment: showClear ? <ClearAdornment onClear={onClear} /> : undefined,
          inputProps: {
            'data-field-kind': kind,
            'data-field-id': fieldId,
            ...(kind === 'integer'
              ? { min: 0, step: 1, style: { textAlign: 'right' } }
              : kind === 'decimal'
                ? { inputMode: 'decimal', pattern: '[0-9]*[.]?[0-9]*', style: { textAlign: 'right' }, onKeyDown: handleKeyDown, onPaste: handlePaste }
                : {}),
          },
        },
      }}
    />
  );
};

export default React.memo(LineItemField);
