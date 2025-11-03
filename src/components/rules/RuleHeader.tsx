import React from 'react';
import { Typography, Stack, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { RuleHeaderProps } from './types';

export const RuleHeader: React.FC<RuleHeaderProps> = ({ label, onAddRule, editingRuleId }) => {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em'
                }}
            >
                {label}
            </Typography>
            <Tooltip title="Add rule">
                <IconButton
                    size="small"
                    color="primary"
                    onClick={onAddRule}
                    sx={{
                        bgcolor: 'transparent',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                        transition: 'background-color 0.2s'
                    }}
                    aria-label={`Add rule for ${label}`}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export const NoRulesMessage: React.FC = () => (
    <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
            fontStyle: 'italic', 
            py: 1 
        }}
    >
        No rules configured
    </Typography>
);