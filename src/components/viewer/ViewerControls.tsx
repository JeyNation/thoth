import React from 'react';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { Stack, Chip } from '@mui/material';

import { IconButton } from '../ui/Button/IconButton';
import { ZoomOut } from '@mui/icons-material';

interface ViewerControlsProps {
  boundingBoxCount: number;
  loadedPages: number;
  totalPages: number;
  showOverlays: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleOverlays: () => void;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  boundingBoxCount,
  loadedPages,
  totalPages,
  showOverlays,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleOverlays,
}) => {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="small" variant="outlined" label={`${boundingBoxCount} fields detected`} />
        {totalPages > 1 && (
          <Chip
            size="small"
            variant="outlined"
            label={`Page ${loadedPages} of ${totalPages} loaded`}
            color={loadedPages < totalPages ? 'primary' : 'default'}
          />
        )}
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
        <IconButton ariaLabel="Zoom In" onClick={onZoomIn} color="primary">
          <ZoomInIcon />
        </IconButton>
        <IconButton ariaLabel="Zoom Out" onClick={onZoomOut} color="primary">
          <ZoomOutIcon />
        </IconButton>
        <IconButton ariaLabel="Reset View" onClick={onResetView} color="primary">
          <RestartAltIcon />
        </IconButton>
        <IconButton
          ariaLabel={showOverlays ? 'Hide Field Overlays' : 'Show Field Overlays'}
          onClick={onToggleOverlays}
          color={showOverlays ? 'primary' : 'default'}
        >
          {showOverlays ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
      </Stack>
    </Stack>
  );
};
