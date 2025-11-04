import type { CSSProperties } from 'react';
import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

export const VIEWER_ROOT_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  gap: 2,
  p: 2,
};

export const VIEWER_CONTAINER_SX = (isKeyActive: boolean | undefined, isDragging: boolean | undefined): SxProps<Theme> => ({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  position: 'relative',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  backgroundColor: 'background.paper',
  cursor: isKeyActive ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
});

export const VIEWER_SVG_HOST_SX = (scaledWidth?: number | string, scaledHeight?: number | string): SxProps<Theme> => ({
  position: 'relative',
  width: scaledWidth || 'auto',
  height: scaledHeight || 'auto',
  minWidth: scaledWidth || 'auto',
  minHeight: scaledHeight || 'auto',
});

export const VIEWER_SVG_TRANSFORM_SX = (baseWidth?: number | string, baseHeight?: number | string, scale = 1, isDragging = false): SxProps<Theme> => ({
  position: 'relative',
  width: baseWidth || 'auto',
  height: baseHeight || 'auto',
  transform: `scale(${scale})`,
  transformOrigin: '0 0',
  transition: isDragging ? 'none' : 'transform 0s linear',
});

export const getSelectionRectStyle = (base: CSSProperties): CSSProperties => {
  if (base.display === 'none') return base;
  return {
    ...base,
    position: 'absolute',
    border: '1px dashed #2196f3',
    backgroundColor: 'rgba(33,150,243,0.1)',
    pointerEvents: 'none',
    zIndex: 25,
  };
};

const viewerStyles = {
  VIEWER_ROOT_SX,
  VIEWER_CONTAINER_SX,
  VIEWER_SVG_HOST_SX,
  VIEWER_SVG_TRANSFORM_SX,
  getSelectionRectStyle,
};

export default viewerStyles;
