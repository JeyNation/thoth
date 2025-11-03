import React from 'react';
import { Box, Stack, Typography, Tooltip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FieldRulesList } from './FieldRulesList';
import { FieldRule } from './types';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';

interface FieldRulesSectionProps {
    fieldLabel: string;
    extractionFieldId: string;
    rules: FieldRule[];
    editingRuleId: string | null;
    draggedRuleIndex: number | null;
    onAddRule: () => void;
    onEditRule: (ruleId: string) => void;
    onDeleteRule: (ruleId: string) => void;
    onDoneEditing: (ruleId: string) => void;
    onUpdateField: (ruleId: string, updates: Partial<AnchorRule | RegexMatchRule | AbsoluteRule>) => void;
    onRuleDragStart: (index: number) => void;
    onRuleDragOver: (e: React.DragEvent) => void;
    onRuleDrop: (index: number) => void;
}

export const FieldRulesSection: React.FC<FieldRulesSectionProps> = ({
    fieldLabel,
    extractionFieldId,
    rules,
    editingRuleId,
    draggedRuleIndex,
    onAddRule,
    onEditRule,
    onDeleteRule,
    onDoneEditing,
    onUpdateField,
    onRuleDragStart,
    onRuleDragOver,
    onRuleDrop
}) => {
    return (
        <Box>
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
                    {fieldLabel}
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
                        aria-label={`Add rule for ${fieldLabel}`}
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
            
            {/* Display rules - mix of view and edit mode */}
            <FieldRulesList
                rules={rules}
                editingRuleId={editingRuleId}
                draggedRuleIndex={draggedRuleIndex}
                extractionFieldId={extractionFieldId}
                onEditRule={onEditRule}
                onDeleteRule={onDeleteRule}
                onDoneEditing={onDoneEditing}
                onUpdateField={onUpdateField}
                onRuleDragStart={onRuleDragStart}
                onRuleDragOver={onRuleDragOver}
                onRuleDrop={onRuleDrop}
            />
        </Box>
    );
};
