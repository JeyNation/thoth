import React from 'react';

import TextField, { TextFieldProps } from '@mui/material/TextField';

export interface TextInputProps {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  endAdornment?: React.ReactNode;
  fullWidth?: boolean;
  id?: string;
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
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
    disabled,
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
    onKeyDown,
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
      onKeyDown={onKeyDown}
      size={size}
      slotProps={builtSlotProps}
      type={type}
      value={value}
      variant={variant}
      disabled={disabled}
    />
  );
});

export default TextInput;
export { TextInput };
