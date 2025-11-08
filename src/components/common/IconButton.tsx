import React from 'react';

import type { SvgIconComponent } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

import { IconButton as DsIconButton } from '@/components/ui';

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
  disabled = false,
}: IconButtonProps) => {
  return (
    <Tooltip title={tooltip}>
      <span>
        <DsIconButton
          ariaLabel={tooltip}
          size={size}
          color={color}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon fontSize="small" />
        </DsIconButton>
      </span>
    </Tooltip>
  );
};
