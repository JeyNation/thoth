import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box } from '@mui/material';
import React from 'react';

import { TextButton } from '../common/TextButton';

interface RulesActionBarProps {
    hasUnsavedChanges: boolean;
    onRerunExtraction?: () => void;
    onSave: () => void;
}

export const RulesActionBar: React.FC<RulesActionBarProps> = ({
    hasUnsavedChanges,
    onRerunExtraction,
    onSave
}) => {
    return (
        <Box sx={{
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
        }}>
            <TextButton
                variant="outlined"
                size="medium"
                onClick={onRerunExtraction || (() => {})}
                disabled={!onRerunExtraction}
                startIcon={<PlayArrowIcon fontSize="small" />}
            >
                {hasUnsavedChanges ? 'Save & Rerun Extraction' : 'Rerun Extraction'}
            </TextButton>
            <TextButton
                size="medium"
                onClick={onSave}
                disabled={!hasUnsavedChanges}
            >
                Save Rules
            </TextButton>
        </Box>
    );
};
