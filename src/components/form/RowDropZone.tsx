import React from 'react';
import { Box, Typography } from '@mui/material';
import { DROP_ACTIVE_BG, DROP_ACTIVE_BORDER, DROP_ACTIVE_INSET } from '../../styles/dropHighlight';

interface RowDropZoneProps {
  lineNumber: number;
  isActive: boolean;
  externallyActive?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const RowDropZone: React.FC<RowDropZoneProps> = ({ lineNumber, isActive, externallyActive = false, onDragOver, onDragLeave, onDrop }) => {
  const active = isActive || externallyActive;
  return (
    <Box sx={{ width: 60, alignSelf: 'stretch' }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 64,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 1.5,
          border: active ? '1px dashed' : '1px solid',
          borderColor: active ? DROP_ACTIVE_BORDER : 'transparent',
          backgroundColor: active ? DROP_ACTIVE_BG : 'transparent',
          boxShadow: active ? DROP_ACTIVE_INSET : 'none',
          transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
          p: 2,
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1, paddingTop: '4px' }}>
          {lineNumber}
        </Typography>
      </Box>
    </Box>
  );
};

export default RowDropZone;
