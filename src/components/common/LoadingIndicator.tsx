import { Box, Typography } from '@mui/material';
import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

interface LoadingIndicatorProps {
  message?: string;
  sx?: SxProps<Theme>;
}

export const LoadingIndicator = ({ 
  message = 'Loading...', 
  sx 
}: LoadingIndicatorProps) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 2,
      color: 'text.secondary',
      ...sx
    }}>
      <Typography fontStyle="italic">{message}</Typography>
    </Box>
  );
};
