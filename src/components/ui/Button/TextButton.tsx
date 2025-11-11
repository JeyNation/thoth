import React from 'react';

import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';

import Button from './Button';

export type TextButtonColor = MuiButtonProps['color'];

export interface TextButtonProps {
  id?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  color?: TextButtonColor;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
}

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(function TextButton(
  props,
  ref,
) {
  const {
    id,
    className,
    ariaLabel,
    title,
    size = 'medium',
    color = 'inherit',
    disabled,
    onClick,
    children,
  } = props;

  return (
    <Button
      ref={ref}
      id={id}
      className={className}
      aria-label={ariaLabel}
      title={title}
      size={size}
      color={color}
      disabled={disabled}
      onClick={onClick}
      variant="text"
    >
      {children}
    </Button>
  );
});

export default TextButton;
export { TextButton };
