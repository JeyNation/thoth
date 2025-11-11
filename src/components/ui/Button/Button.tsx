import React from 'react';

import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export type ButtonVariant = 'text' | 'contained' | 'outlined';
export type ButtonColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'inherit'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'type'> {
  id?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: ButtonVariant;
  color?: ButtonColor;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    id,
    className,
    ariaLabel,
    title,
    size = 'medium',
    variant = 'contained',
    color = 'primary',
    disabled,
    onClick,
    children,
    ...rest
  } = props;

  return (
    <MuiButton
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      id={id}
      className={className}
      aria-label={ariaLabel}
      title={title}
      size={size}
      variant={variant}
      color={color as MuiButtonProps['color']}
      disabled={disabled}
      onClick={onClick}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </MuiButton>
  );
});

export default Button;
export { Button };
