import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

export const RULES_ROOT_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  borderRadius: 2,
  backgroundColor: 'background.paper',
};

export const RULES_CONTENT_SX: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  p: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const rulesStyles = {
  RULES_ROOT_SX,
  RULES_CONTENT_SX,
};

export default rulesStyles;
