import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import DropZone from '../DropZone';
import { applyDropHighlightSx, DROP_ACTIVE_BORDER, DROP_BORDER_RADIUS_PX } from '../../styles/dropHighlight';

interface ColumnDropHeaderProps<T extends string> {
  columns: readonly T[];
  titleFor: (col: T) => string;
  onDrop: (col: T, e: React.DragEvent) => void;
  externallyActive?: boolean;
}

const baseStyle: React.CSSProperties = {
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
  boxShadow: 'inset 0 0 0 0 rgba(25,118,210,0.08)'
};

const activeStyle: React.CSSProperties = {
  borderColor: DROP_ACTIVE_BORDER,
  borderStyle: 'dashed',
  borderWidth: '1px',
  // Intentionally do not change background; show only dashed border on active.
};

function ColumnDropHeader<T extends string>({ columns, titleFor, onDrop, externallyActive = false }: ColumnDropHeaderProps<T>) {
  return (
    <Box
      sx={{
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
        backgroundImage: (theme: Theme) => `linear-gradient(${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 60%, rgba(255,255,255,0) 100%)`,
        pb: 1,
      }}
    >
      {columns.map((col) => (
        <DropZone
          key={`compact-col-${col}`}
          onDrop={(e) => onDrop(col, e)}
          baseStyle={baseStyle}
          activeStyle={activeStyle}
          externallyActive={externallyActive}
        >
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
            {titleFor(col)}
          </Typography>
        </DropZone>
      ))}
    </Box>
  );
}

export default ColumnDropHeader;
