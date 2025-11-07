import React from 'react';
import MuiIconButton, { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';

export type IconButtonProps = MuiIconButtonProps & {};

const IconButton = (props: IconButtonProps) => {
  return <MuiIconButton {...props} />;
};

export default IconButton;
