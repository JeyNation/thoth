import MuiIconButton from '@mui/material/IconButton';
import type { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import React from 'react';

// Design-system IconButton: expose a small, stable prop surface and hide
// MUI-specific props. Consumers should use these props only.
export type IconButtonColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'inherit'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export interface IconButtonProps {
  id?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  color?: IconButtonColor;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  props,
  ref,
) {
  const {
    id,
    ariaLabel,
    className,
    children,
    disabled,
    onClick,
    size = 'medium',
    title,
    color = 'default',
  } = props;
  return (
    <MuiIconButton
      ref={ref}
      id={id}
      className={className}
      aria-label={ariaLabel}
      title={title}
      size={size}
      color={color as MuiIconButtonProps['color']}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </MuiIconButton>
  );
});

export default IconButton;
export { IconButton };
