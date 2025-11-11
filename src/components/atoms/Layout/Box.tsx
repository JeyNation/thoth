import React from 'react';

import MuiBox, { BoxProps as MuiBoxProps } from '@mui/material/Box';

export type BoxProps = MuiBoxProps;

const Box: React.FC<BoxProps> = props => {
  return <MuiBox {...props} />;
};

export default Box;
export { Box };
