import React from 'react';
import { Box, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

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
            <Button
                variant="outlined"
                onClick={onRerunExtraction}
                disabled={!onRerunExtraction}
                startIcon={<PlayArrowIcon fontSize="small" />}
                sx={{ minWidth: 200, borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
            >
                {hasUnsavedChanges ? 'Save & Rerun Extraction' : 'Rerun Extraction'}
            </Button>
            <Button
                variant="contained"
                onClick={onSave}
                disabled={!hasUnsavedChanges}
                sx={{ minWidth: 150, borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
            >
                Save Rules
            </Button>
        </Box>
    );
};
