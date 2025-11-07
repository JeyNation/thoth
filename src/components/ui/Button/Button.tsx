import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export type ButtonProps = MuiButtonProps & {
  /** design-system variants can be extended here */
};

const Button = (props: ButtonProps) => {
  return <MuiButton {...props} />;
};

export default Button;
