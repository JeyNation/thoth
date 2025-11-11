import React from 'react';

import { Typography } from '@mui/material';

interface SubsectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SubsectionLabel = ({ children, className }: SubsectionLabelProps) => {
  return (
    <Typography variant="caption" color="text.secondary" className={className}>
      {children}
    </Typography>
  );
};
