import React from 'react';
import { Box, Typography } from '@mui/material';
import DropZone from '../DropZone';
import { DROP_ZONE_ACTIVE_STYLE } from '../../styles/dropHighlight';

interface RowDropZoneProps {
  lineNumber: number;
  isActive: boolean;
  externallyActive?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const RowDropZone: React.FC<RowDropZoneProps> = ({ lineNumber, isActive, externallyActive = false, onDragOver, onDragLeave, onDrop }) => {
  const baseStyle: React.CSSProperties = {
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

  const activeStyle: React.CSSProperties = {
    borderWidth: DROP_ZONE_ACTIVE_STYLE.borderWidth,
    borderStyle: DROP_ZONE_ACTIVE_STYLE.borderStyle,
    borderColor: DROP_ZONE_ACTIVE_STYLE.borderColor,
    transition: DROP_ZONE_ACTIVE_STYLE.transition,
  };

  return (
    <Box sx={{ width: 60, alignSelf: 'stretch' }}>
      <DropZone
        baseStyle={baseStyle}
        activeStyle={activeStyle}
        onDragOver={onDragOver}
        onDragOverExtra={undefined}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        externallyActive={externallyActive}
      >
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1, paddingTop: '4px' }}>
          {lineNumber}
        </Typography>
      </DropZone>
    </Box>
  );
};

export default RowDropZone;
