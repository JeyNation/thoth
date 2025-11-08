import type { CSSProperties } from 'react';

import type { SxProps, Theme } from '@mui/material';

import { DROP_BORDER_RADIUS_PX, DROP_ZONE_ACTIVE_STYLE } from './dropHighlight';

export const COLUMN_DROP_BASE_STYLE: CSSProperties = {
  width: '100%',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(120, 144, 156, 0.45)',
  borderRadius: DROP_BORDER_RADIUS_PX,
  background: 'rgba(248, 250, 252, 0.85)',
  padding: '6px 8px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  minHeight: 40,
  transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
  boxShadow: 'inset 0 0 0 0 rgba(25,118,210,0.08)',
};

export const COLUMN_DROP_ACTIVE_STYLE: CSSProperties = {
  ...DROP_ZONE_ACTIVE_STYLE,
};

export const COLUMN_DROP_CONTAINER_SX: SxProps<Theme> = {
  position: 'sticky',
  top: 0,
  zIndex: 5,
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(4, minmax(0, 1fr))',
  },
  gap: 1,
  backgroundImage: (theme: Theme) =>
    `linear-gradient(${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 60%, rgba(255,255,255,0) 100%)`,
  pb: 1,
};

export const COLUMN_DROP_LABEL_SX: SxProps<Theme> = {
  textAlign: 'center',
  width: '100%',
  fontWeight: 600,
  color: 'text.secondary',
};

const columnDropStyles = {
  COLUMN_DROP_BASE_STYLE,
  COLUMN_DROP_ACTIVE_STYLE,
  COLUMN_DROP_CONTAINER_SX,
  COLUMN_DROP_LABEL_SX,
};

export default columnDropStyles;
