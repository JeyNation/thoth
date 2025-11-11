import React from 'react';

import MuiDivider, { DividerProps as MuiDividerProps } from '@mui/material/Divider';

export type DividerProps = MuiDividerProps;

const Divider: React.FC<DividerProps> = props => {
  return <MuiDivider {...props} />;
};

export default Divider;
export { Divider };
