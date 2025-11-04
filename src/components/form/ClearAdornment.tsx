import React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '../common/IconButton';

interface ClearAdornmentProps {
  onClear: () => void;
  title?: string;
}

const ClearAdornment: React.FC<ClearAdornmentProps> = ({ onClear, title = 'Clear field' }) => {
  return (
    <InputAdornment position="end">
      <IconButton
        icon={CloseIcon}
        tooltip={title}
        size="small"
        onClick={onClear}
      />
    </InputAdornment>
  );
};

export default ClearAdornment;
