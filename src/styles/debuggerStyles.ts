import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

export const DEBUGGER_CONTAINER_SX: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export const DEBUGGER_HEADER_TITLE_SX: SxProps<Theme> = {
  color: 'common.white',
  fontWeight: 600,
  letterSpacing: 0.6,
};

export const DEBUGGER_HIDE_BUTTON_SX: SxProps<Theme> = {
  color: 'common.white',
  border: '1px solid rgba(255,255,255,0.18)',
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 1,
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
};

export const DEBUGGER_DIVIDER_SX: SxProps<Theme> = {
  borderColor: 'rgba(255,255,255,0.12)',
};

export const DEBUGGER_GRID_SX: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 2,
  minHeight: 0,
  flex: 1,
};

export const DEBUGGER_LEFT_STACK_SX: SxProps<Theme> = {
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
  pr: 1,
};

export const DEBUGGER_CAPTION_SX: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.6)',
};

export const DEBUGGER_BODY_SMALL_SX: SxProps<Theme> = {
  mt: 0.5,
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.85)',
};

export const DEBUGGER_BODY_SMALL_PLAIN_SX: SxProps<Theme> = {
  fontSize: '0.75rem',
};

export const DEBUGGER_LINKED_INPUTS_LETTER_SX: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.6)',
  letterSpacing: 0.5,
};

export const DEBUGGER_LINKED_ID_SX: SxProps<Theme> = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.85)',
  wordBreak: 'break-all',
};

export const DEBUGGER_PRE_SX: SxProps<Theme> = {
  mt: 0.5,
  p: 1,
  borderRadius: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
  fontSize: '0.7rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflow: 'auto',
  flex: 1,
  minHeight: 0,
};

export const DEBUGGER_INFO_LABEL_SX: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.6)',
};

export const DEBUGGER_INFO_VALUE_SX: SxProps<Theme> = {
  mt: 0.5,
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.85)',
};

const debuggerStyles = {
  DEBUGGER_CONTAINER_SX,
  DEBUGGER_HEADER_TITLE_SX,
  DEBUGGER_HIDE_BUTTON_SX,
  DEBUGGER_DIVIDER_SX,
  DEBUGGER_GRID_SX,
  DEBUGGER_LEFT_STACK_SX,
  DEBUGGER_CAPTION_SX,
  DEBUGGER_BODY_SMALL_SX,
  DEBUGGER_BODY_SMALL_PLAIN_SX,
  DEBUGGER_LINKED_INPUTS_LETTER_SX,
  DEBUGGER_LINKED_ID_SX,
  DEBUGGER_PRE_SX,
  DEBUGGER_INFO_LABEL_SX,
  DEBUGGER_INFO_VALUE_SX,
};

export default debuggerStyles;
