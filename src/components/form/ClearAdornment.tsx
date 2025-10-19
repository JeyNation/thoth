import React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface ClearAdornmentProps {
  onClear: () => void;
  title?: string;
}

const ClearAdornment: React.FC<ClearAdornmentProps> = ({ onClear, title = 'Clear field' }) => {
  return (
    <InputAdornment position="end">
      <Tooltip title={title}>
        <IconButton
          size="small"
          edge="end"
          aria-label={title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            onClear();
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );
};

export default ClearAdornment;
