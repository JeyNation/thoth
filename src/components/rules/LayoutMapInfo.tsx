import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { LayoutMap } from '../../types/extractionRules';

interface LayoutMapInfoProps {
    layoutMap: LayoutMap;
}

export const LayoutMapInfo: React.FC<LayoutMapInfoProps> = ({ layoutMap }) => {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">ID</Typography>
                    <Typography variant="body2">{layoutMap.id}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Name</Typography>
                    <Typography variant="body2">{layoutMap.name || 'N/A'}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Vendor ID</Typography>
                    <Typography variant="body2">{layoutMap.vendorId || 'N/A'}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Version</Typography>
                    <Typography variant="body2">{layoutMap.version || 'N/A'}</Typography>
                </Box>
            </Stack>
        </Paper>
    );
};
