import React from 'react';

import { Box, Typography } from '@mui/material';

import {
  ROW_DROP_BASE_STYLE,
  ROW_DROP_ACTIVE_STYLE,
  ROW_DROP_CONTAINER_SX,
  ROW_DROP_LABEL_SX,
} from '../../styles/rowDropStyles';
import DropZone from '../DropZone';

interface RowDropZoneProps {
  lineNumber: number;
  externallyActive?: boolean;
  onDrop: (e: React.DragEvent) => void;
}

const RowDropZone: React.FC<RowDropZoneProps> = ({
  lineNumber,
  externallyActive = false,
  onDrop,
}) => {
  return (
    <Box sx={ROW_DROP_CONTAINER_SX}>
      <DropZone
        onDrop={onDrop}
        baseStyle={ROW_DROP_BASE_STYLE}
        activeStyle={ROW_DROP_ACTIVE_STYLE}
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
