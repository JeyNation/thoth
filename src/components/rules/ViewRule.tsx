import React from 'react';
import { Paper, Stack, Box, Typography, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ViewRuleProps } from './types';
import { generatePseudoRule } from '../../utils/ruleUtils';

export const ViewRule: React.FC<ViewRuleProps> = ({
    rule,
    index,
    onEdit,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    isDragged
}) => {
    // Compute this once at the component level
    const pseudoLines = generatePseudoRule(rule);
    const isSingleLine = pseudoLines.length === 1;

    return (
        <Paper 
            variant="outlined" 
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            sx={{ 
                p: 1.5, 
                bgcolor: 'action.hover',
                cursor: 'grab',
                '&:active': {
                    cursor: 'grabbing',
                },
                opacity: isDragged ? 0.5 : 1,
                transition: 'opacity 0.2s',
            }}
        >
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems={isSingleLine ? 'center' : 'flex-start'} sx={{ flex: 1 }}>
                    <DragIndicatorIcon 
                        fontSize="small" 
                        sx={{ color: 'text.secondary', cursor: 'grab', mt: isSingleLine ? 0.6 : 0.25 }}
                    />
                    <Box sx={{ flex: 1 }}>
                        {pseudoLines.map((line: string, lineIndex: number) => (
                            <Typography 
                                key={lineIndex} 
                                variant="body2" 
                                sx={{ 
                                    mb: lineIndex < pseudoLines.length - 1 ? 0.5 : 0,
                                    '&::before': lineIndex > 0 ? {
                                        content: '"→ "',
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        mr: 0.5
                                    } : undefined
                                }}
                            >
                                {line}
                            </Typography>
                        ))}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems={isSingleLine ? 'center' : 'flex-start'} sx={{ mt: isSingleLine ? 0 : -0.5 }}>
                    <IconButton
                        size="small"
                        onClick={onEdit}
                        sx={{ color: 'text.secondary' }}
                        aria-label="Edit rule"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={onDelete}
                        sx={{ color: 'error.main' }}
                        aria-label="Delete rule"
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
        </Paper>
    );
};