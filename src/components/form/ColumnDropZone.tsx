import React from 'react';

import { Box, Typography } from '@mui/material';

import {
  COLUMN_DROP_BASE_STYLE,
  COLUMN_DROP_ACTIVE_STYLE,
  COLUMN_DROP_CONTAINER_SX,
  COLUMN_DROP_LABEL_SX,
} from '../../styles/columnDropStyles';
import DropZone from '../DropZone';

interface ColumnDropZoneProps<T extends string> {
  columns: readonly T[];
  externallyActive?: boolean;
  titleFor: (col: T) => string;
  onDrop: (col: T, e: React.DragEvent) => void;
}

function ColumnDropZone<T extends string>({
  columns,
  titleFor,
  onDrop,
  externallyActive = false,
}: ColumnDropZoneProps<T>) {
  return (
    <Box sx={COLUMN_DROP_CONTAINER_SX}>
      {columns.map(col => (
        <DropZone
          key={`col-${col}`}
          onDrop={e => onDrop(col, e)}
          baseStyle={COLUMN_DROP_BASE_STYLE}
          activeStyle={COLUMN_DROP_ACTIVE_STYLE}
          externallyActive={externallyActive}
        >
          <Typography variant="body2" sx={COLUMN_DROP_LABEL_SX}>
            {titleFor(col)}
          </Typography>
        </DropZone>
      ))}
    </Box>
  );
}

export default ColumnDropZone;
