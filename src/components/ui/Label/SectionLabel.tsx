import React from 'react';
import { Typography } from '@mui/material';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionLabel = ({ children, className }: SectionLabelProps) => {
  return (
    <Typography variant="caption" color="text.secondary" className={className}>
      {children}
    </Typography>
  );
};
