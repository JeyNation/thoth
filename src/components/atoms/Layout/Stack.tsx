import React from 'react';

import MuiStack, { StackProps as MuiStackProps } from '@mui/material/Stack';

export type StackProps = MuiStackProps;

const Stack: React.FC<StackProps> = props => {
  return <MuiStack {...props} />;
};

export default Stack;
export { Stack };
