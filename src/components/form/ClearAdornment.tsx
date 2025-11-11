import React from 'react';

import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';

import { IconButton } from '../ui/Button/IconButton';

interface ClearAdornmentProps {
  onClear: () => void;
  title?: string;
}

const ClearAdornment: React.FC<ClearAdornmentProps> = ({ onClear, title = 'Clear field' }) => {
  return (
    <InputAdornment position="end">
      <IconButton ariaLabel={title} title={title} size="small" onClick={onClear}>
        <CloseIcon />
      </IconButton>
    </InputAdornment>
  );
};

export default ClearAdornment;
