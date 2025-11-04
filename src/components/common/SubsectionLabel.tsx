import { Typography } from '@mui/material';

interface SubsectionLabelProps {
  children: React.ReactNode;
}

export const SubsectionLabel = ({ children }: SubsectionLabelProps) => {
  return (
    <Typography 
      variant="caption" 
      color="text.secondary"
      sx={{ 
        display: 'block',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        mb: 1
      }}
    >
      {children}
    </Typography>
  );
};
