import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

export const WORKSPACE_ROOT_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  gap: 2,
};

export const WORKSPACE_INNER_SX: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export const WORKSPACE_GRID_SX: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
  gap: 2,
  position: 'relative',
  alignItems: 'stretch',
};

export const WORKSPACE_PANEL_PAPER_SX: SxProps<Theme> = {
  minWidth: 0,
  minHeight: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 3,
};

export const WORKSPACE_PANEL_BOX_SX: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
};

export const WORKSPACE_SHOW_DEBUG_BUTTON_SX: SxProps<Theme> = {
  alignSelf: 'flex-start',
  px: 1.5,
  py: 0.5,
  borderRadius: '9999px',
  backgroundColor: 'rgba(0,0,0,0.72)',
  color: 'common.white',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
  userSelect: 'none',
};

export const WORKSPACE_DEBUG_RESIZER_SX: SxProps<Theme> = {
  height: 6,
  flexShrink: 0,
  background: 'linear-gradient(180deg,#d0d0d0,#b5b5b5)',
  boxShadow: 'inset 0 0 3px rgba(153,153,153,0.75)',
  cursor: 'row-resize',
  borderRadius: 99,
  userSelect: 'none',
};

export const WORKSPACE_DEBUG_CONTAINER_SX = (height: number): SxProps<Theme> => ({
  height,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(17,24,39,0.92)',
  color: 'rgba(255,255,255,0.92)',
  fontSize: '0.75rem',
  borderRadius: 3,
  overflow: 'hidden',
  boxShadow: '0 -6px 16px rgba(15,23,42,0.55)',
});

export default {
  WORKSPACE_ROOT_SX,
  WORKSPACE_INNER_SX,
  WORKSPACE_GRID_SX,
  WORKSPACE_PANEL_PAPER_SX,
  WORKSPACE_PANEL_BOX_SX,
  WORKSPACE_SHOW_DEBUG_BUTTON_SX,
  WORKSPACE_DEBUG_RESIZER_SX,
  WORKSPACE_DEBUG_CONTAINER_SX,
};
