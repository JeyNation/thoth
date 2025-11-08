import React from 'react';

import TextField, { TextFieldProps } from '@mui/material/TextField';

export interface TextInputProps {
  ariaLabel?: string;
  className?: string;
  endAdornment?: React.ReactNode;
  fullWidth?: boolean;
  id?: string;
  // Allow arbitrary data-* attributes and other custom props consumers may forward.
  // Use Record<string, unknown> instead of `any` to keep typings permissive but safe.
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> &
    Record<string, unknown>;
  label?: React.ReactNode;
  minRows?: number;
  multiline?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onDragLeave?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  shrinkLabel?: boolean;
  size?: 'small' | 'medium';
  type?: string;
  value?: string | number;
  variant?: 'outlined' | 'filled' | 'standard';
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  props,
  ref,
) {
  const {
    ariaLabel,
    className,
    endAdornment,
    fullWidth = false,
    id,
    inputProps,
    label,
    minRows,
    multiline,
    onBlur,
    onChange,
    onDragLeave,
    onDragOver,
    onDrop,
    onFocus,
    shrinkLabel,
    size = 'medium',
    type,
    value,
    variant = 'outlined',
  } = props;

  const builtSlotProps: TextFieldProps['slotProps'] = {
    inputLabel: shrinkLabel ? { shrink: true } : undefined,
    input: {
      endAdornment,
      inputProps: inputProps ?? undefined,
    },
  };

  return (
    <TextField
      inputRef={ref}
      aria-label={ariaLabel}
      className={className}
      id={id}
      fullWidth={fullWidth}
      label={label}
      minRows={minRows}
      multiline={multiline}
      onBlur={onBlur}
      onChange={onChange}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onFocus={onFocus}
      size={size}
      slotProps={builtSlotProps}
      type={type}
      value={value}
      variant={variant}
    />
  );
});

export default TextInput;
export { TextInput };
