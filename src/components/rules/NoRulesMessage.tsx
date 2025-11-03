import React from 'react';
import { Box, Typography } from '@mui/material';

interface NoRulesMessageProps {
    field?: string;
}

export const NoRulesMessage: React.FC<NoRulesMessageProps> = ({ field }) => (
    <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
            No rules defined {field ? `for ${field}` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            Click "Add Rule" to create your first rule
        </Typography>
    </Box>
);