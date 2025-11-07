import type { SvgIconComponent } from '@mui/icons-material';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';
import React from 'react';

interface IconButtonProps {
  icon: SvgIconComponent;
  tooltip: string;
  onClick: (() => void) | ((event: React.MouseEvent) => void);
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const IconButton = ({ 
  icon: Icon, 
  tooltip, 
  onClick, 
  color = 'primary',
  size = 'small',
  disabled = false
}: IconButtonProps) => {
  return (
    <Tooltip title={tooltip}>
      <span>
        <MuiIconButton
          size={size}
          color={color}
          onClick={onClick}
          disabled={disabled}
          sx={{
            bgcolor: 'transparent',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            transition: 'background-color 0.2s'
          }}
        >
          <Icon fontSize="small" />
        </MuiIconButton>
      </span>
    </Tooltip>
  );
};
