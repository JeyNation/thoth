import React from 'react';

import { SvgIconComponent } from '@mui/icons-material';
import { Button, SxProps, Theme } from '@mui/material';

export interface TextButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
  startIcon?: React.ReactElement<SvgIconComponent>;
  endIcon?: React.ReactElement<SvgIconComponent>;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

export const TextButton: React.FC<TextButtonProps> = ({
  children,
  onClick,
  variant = 'contained',
  size = 'small',
  color = 'primary',
  disabled = false,
  startIcon,
  endIcon,
  fullWidth = false,
  sx,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      color={color}
      disabled={disabled}
      onClick={onClick}
      startIcon={startIcon}
      endIcon={endIcon}
      fullWidth={fullWidth}
      sx={{
        borderRadius: 5,
        ...(size === 'small' && {
          px: 2,
        }),
        '& .MuiButton-startIcon': {
          marginRight: 0.5,
        },
        '& .MuiButton-endIcon': {
          marginLeft: 0.5,
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};
