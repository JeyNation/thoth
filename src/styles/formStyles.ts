import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

export const FORM_ROOT_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  borderRadius: 2,
  backgroundColor: 'background.paper',
};

export const FORM_SCROLL_AREA_SX: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  p: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export const FORM_SECTION_CONTAINER_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export const FORM_CAPTION_UPPER_SX: SxProps<Theme> = {
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

export const FORM_LINE_ITEMS_STACK_SX: SxProps<Theme> = {
  pr: 0.5,
};

export const FORM_ADD_BUTTON_BASE_SX: SxProps<Theme> = {
  alignSelf: 'flex-start',
  borderRadius: 999,
  px: 2.5,
  py: 1,
  fontWeight: 600,
};

export const FORM_ADD_BUTTON_ACTIVE_SX: SxProps<Theme> = {
  border: '1px dashed rgba(44,123,229,0.75)',
  backgroundColor: 'rgba(44,123,229,0.12)',
  color: 'primary.main',
};

export default {
  FORM_ROOT_SX,
  FORM_SCROLL_AREA_SX,
  FORM_SECTION_CONTAINER_SX,
  FORM_CAPTION_UPPER_SX,
  FORM_LINE_ITEMS_STACK_SX,
  FORM_ADD_BUTTON_BASE_SX,
  FORM_ADD_BUTTON_ACTIVE_SX,
};
