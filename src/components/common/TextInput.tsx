import React from 'react';

import { TextField, SxProps, Theme } from '@mui/material';

export interface TextInputProps {
  value: string | number;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  sx?: SxProps<Theme>;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onKeyPress,
  label,
  placeholder,
  type = 'text',
  size = 'small',
  fullWidth = false,
  disabled = false,
  inputProps,
  sx,
}) => {
  return (
    <TextField
      size={size}
      type={type}
      label={label}
      placeholder={placeholder}
      fullWidth={fullWidth}
      disabled={disabled}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
        htmlInput: inputProps,
      }}
      onKeyDown={onKeyPress}
      sx={sx}
    />
  );
};
