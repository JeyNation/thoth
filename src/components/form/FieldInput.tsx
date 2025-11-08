import React, { useEffect, useState } from 'react';

import { TextInput } from '@/components/ui';

import ClearAdornment from './ClearAdornment';

export type FieldKind = 'text' | 'textarea' | 'integer' | 'decimal' | 'date';

export interface FieldInputProps {
  id?: string;

  lineNumber?: number;

  kind: FieldKind;
  value: string | number;

  ariaLabel?: string;
  isDragActive: boolean;
  isLinked?: boolean;
  label: string;

  onChange: (value: string | number, opts?: { explicitClear?: boolean }) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const FieldInput: React.FC<FieldInputProps> = ({
  id,
  kind,
  value,
  isDragActive,
  isLinked,
  ariaLabel,
  label,
  onChange,
  onClear,
  onFocus,
  onBlur,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const isNumeric = kind === 'integer' || kind === 'decimal';
  const showClear = isNumeric
    ? value != null && value !== 0
    : typeof value === 'string' && value.trim() !== '';

  const [display, setDisplay] = useState<string>(() =>
    isNumeric ? String(value ?? 0) : typeof value === 'string' ? value : '',
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isNumeric) return;
    if (!isFocused) {
      const parentNum =
        typeof value === 'number'
          ? value
          : kind === 'integer'
          ? parseInt(String(value || '0'), 10) || 0
          : parseFloat(String(value || '0')) || 0;
      const displayNum =
        kind === 'integer' ? parseInt(display || '0', 10) || 0 : parseFloat(display || '0') || 0;
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
      const valid = raw === '' || /^\d*(\.\d*)?$/.test(raw);
      if (!valid) return;
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
    if (isNumeric) {
      const raw = event.target.value;
      if (raw !== '') {
        let normalizedStr: string;
        if (kind === 'integer') {
          normalizedStr = raw.replace(/^0+(?=\d)/, '').trim();
          if (normalizedStr === '') normalizedStr = '0';
          setDisplay(normalizedStr);
          const normalizedNum = parseInt(normalizedStr, 10) || 0;
          if (normalizedNum !== value) onChange(normalizedNum);
        } else {
          const dot = raw.indexOf('.');
          if (dot >= 0) {
            let intPart = raw.slice(0, dot);
            const fracPart = raw.slice(dot + 1);
            intPart = intPart.replace(/^0+(?=\d)/, '');
            if (intPart === '') intPart = '0';
            normalizedStr = `${intPart}.${fracPart}`;
          } else {
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

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (kind !== 'decimal') return;
    if (e.ctrlKey || e.metaKey) return;
    const key = e.key;
    const nav = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Tab',
      'Enter',
      'Escape',
    ];
    if (nav.includes(key)) return;
    if (key >= '0' && key <= '9') return;
    if (key === '.') {
      if (display.includes('.')) e.preventDefault();
      return;
    }
    e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (kind !== 'decimal') return;
    const text = e.clipboardData.getData('text');
    let cleaned = text.replace(/[^0-9.]/g, '');
    if (display.includes('.')) {
      cleaned = cleaned.replace(/\./g, '');
    } else {
      const firstDot = cleaned.indexOf('.');
      if (firstDot !== -1)
        cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    if (cleaned.length === 0) e.preventDefault();
  };

  const type =
    kind === 'integer' ? 'number' : kind === 'decimal' ? 'text' : kind === 'date' ? 'date' : 'text';

  const inputNativeProps: Record<string, unknown> = {
    'data-field-kind': kind,
    'data-field-id': id,
    ...(kind === 'integer'
      ? { min: 0, step: 1, style: { textAlign: 'right' } as React.CSSProperties }
      : kind === 'decimal'
      ? {
          inputMode: 'decimal',
          pattern: '[0-9]*[.]?[0-9]*',
          style: { textAlign: 'right' } as React.CSSProperties,
          // Narrow to the appropriate handler types without using `any`.
          onKeyDown: handleKeyDown as unknown as React.EventHandler<
            React.KeyboardEvent<HTMLInputElement>
          >,
          onPaste: handlePaste as unknown as React.EventHandler<
            React.ClipboardEvent<HTMLInputElement>
          >,
        }
      : {}),
  };

  const classes = (() => {
    if (isDragActive) return 'thoth-drop-active drop-active';
    if (isLinked && isFocused) return 'thoth-field-linked-focused field-linked-focused';
    if (isLinked) return 'thoth-field-linked field-linked';
    if (isFocused) return 'thoth-field-focused field-focused';
    return '';
  })();

  return (
    <TextInput
      key={id}
      fullWidth
      size="small"
      variant="outlined"
      value={isNumeric ? display : typeof value === 'string' ? value : String(value)}
      type={type}
      ariaLabel={ariaLabel}
      label={label}
      multiline={kind === 'textarea'}
      minRows={kind === 'textarea' ? 2 : undefined}
      shrinkLabel
      className={classes}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      endAdornment={showClear ? <ClearAdornment onClear={onClear} /> : undefined}
      inputProps={inputNativeProps}
    />
  );
};

export default React.memo(FieldInput);
