import { Typography } from '@mui/material';

interface SectionLabelProps {
  children: React.ReactNode;
}

export const SectionLabel = ({ children }: SectionLabelProps) => {
  return (
    <Typography 
      variant="caption" 
      color="text.secondary" 
      sx={{
        display: 'block',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
};
