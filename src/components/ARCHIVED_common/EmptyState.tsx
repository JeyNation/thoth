import { Box, Typography } from '@mui/material';
import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

interface EmptyStateProps {
  message: string;
  description?: string;
  sx?: SxProps<Theme>;
}

export const EmptyState = ({ message, description, sx }: EmptyStateProps) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        ...sx,
      }}
    >
      <Typography color="text.secondary">{message}</Typography>
      {description && (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
};
