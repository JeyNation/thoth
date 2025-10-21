import React from 'react';
import { Box, Typography } from '@mui/material';
import DropZone from '../DropZone';
import { 
  ROW_DROP_BASE_STYLE, 
  ROW_DROP_ACTIVE_STYLE, 
  ROW_DROP_CONTAINER_SX,
  ROW_DROP_LABEL_SX 
} from '../../styles/rowDropStyles';

interface RowDropZoneProps {
  lineNumber: number;
  isActive: boolean;
  externallyActive?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const RowDropZone: React.FC<RowDropZoneProps> = ({ lineNumber, isActive, externallyActive = false, onDragOver, onDragLeave, onDrop }) => {
  return (
    <Box sx={ROW_DROP_CONTAINER_SX}>
      <DropZone
        baseStyle={ROW_DROP_BASE_STYLE}
        activeStyle={ROW_DROP_ACTIVE_STYLE}
        onDragOver={onDragOver}
        onDragOverExtra={undefined}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        externallyActive={externallyActive}
      >
        <Typography variant="body2" sx={ROW_DROP_LABEL_SX}>
          {lineNumber}
        </Typography>
      </DropZone>
    </Box>
  );
};

export default RowDropZone;
