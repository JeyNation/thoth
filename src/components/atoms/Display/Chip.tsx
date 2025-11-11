import React from 'react';

import MuiChip, { ChipProps as MuiChipProps } from '@mui/material/Chip';

export type ChipProps = MuiChipProps;

const Chip: React.FC<ChipProps> = props => {
  return <MuiChip {...props} />;
};

export default Chip;
export { Chip };
