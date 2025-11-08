import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export interface TextInputProps {
  /** CSS class applied to the outer TextField root — used for semantic state classes */
  className?: string;
  id?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;

  ariaLabel?: string;
  label?: React.ReactNode;

  multiline?: boolean;
  minRows?: number;
  type?: string;

  shrinkLabel?: boolean;

  endAdornment?: React.ReactNode;

  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;

  onDragOver?: React.DragEventHandler;
  onDragLeave?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;

  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  props,
  ref,
) {
  const {
    value,
    onChange,
    onFocus,
    onBlur,
    ariaLabel,
    label,
    multiline,
    minRows,
    type,
    endAdornment,
    inputProps,
    onDragOver,
    onDragLeave,
    onDrop,
    fullWidth = false,
    size = 'medium',
    variant = 'outlined',
    id,
    shrinkLabel,
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
      className={props.className}
      id={id}
      fullWidth={fullWidth}
      size={size}
      variant={variant}
      value={value}
      type={type}
      aria-label={ariaLabel}
      slotProps={builtSlotProps}
      label={label}
      multiline={multiline}
      minRows={minRows}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    />
  );
});

export default TextInput;
export { TextInput };
