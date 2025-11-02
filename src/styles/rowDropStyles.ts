import type { CSSProperties } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { DROP_ZONE_ACTIVE_STYLE } from './dropHighlight';

export const ROW_DROP_BASE_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 64,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  borderRadius: 1.5,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'transparent',
  transition: DROP_ZONE_ACTIVE_STYLE.transition,
  padding: 16,
};

export const ROW_DROP_CONTAINER_SX: SxProps<Theme> = {
  width: 60,
  alignSelf: 'stretch'
};

export const ROW_DROP_ACTIVE_STYLE: CSSProperties = {
  borderWidth: DROP_ZONE_ACTIVE_STYLE.borderWidth,
  borderStyle: DROP_ZONE_ACTIVE_STYLE.borderStyle,
  borderColor: DROP_ZONE_ACTIVE_STYLE.borderColor,
  transition: DROP_ZONE_ACTIVE_STYLE.transition,
};

export const ROW_DROP_LABEL_SX: SxProps<Theme> = {
  fontWeight: 600,
  lineHeight: 1,
  paddingTop: '4px',
};

const rowDropStyles = {
  ROW_DROP_BASE_STYLE,
  ROW_DROP_ACTIVE_STYLE,
  ROW_DROP_LABEL_SX,
  ROW_DROP_CONTAINER_SX,
};

export default rowDropStyles;
