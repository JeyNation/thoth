'use client';

import React from 'react';

import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

type Option = { value: string | number; label: React.ReactNode };

export interface DropdownProps {
  id?: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  ariaLabel?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  fullWidth = true,
  size = 'small',
  disabled = false,
  ariaLabel,
}) => {
  const handleChange = (e: SelectChangeEvent<string | number>) => {
    onChange(String(e.target.value));
  };

  return (
    <FormControl fullWidth={fullWidth} size={size}>
      {label ? <InputLabel id={id ? `${id}-label` : undefined}>{label}</InputLabel> : null}
      <Select
        id={id}
        labelId={id ? `${id}-label` : undefined}
        value={String(value ?? '')}
        label={label}
        onChange={handleChange}
        disabled={disabled}
        inputProps={{ 'aria-label': ariaLabel }}
      >
        {options.map(opt => (
          <MenuItem key={String(opt.value)} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default Dropdown;
export { Dropdown };
export type { Option };
