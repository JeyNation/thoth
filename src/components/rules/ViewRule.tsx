import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import { Paper, Stack } from '@mui/material';
import React from 'react';

import { RuleText } from './RuleText';
import { ViewRuleProps } from '../../types/rulesComponents';
import { generatePseudoRule } from '../../utils/ruleUtils';
import { IconButton } from '../common/IconButton';

export const ViewRule: React.FC<ViewRuleProps> = ({
    rule,
    onEdit,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    isDragged
}) => {
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
                    <RuleText lines={pseudoLines} />
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems={isSingleLine ? 'center' : 'flex-start'} sx={{ mt: isSingleLine ? 0 : -0.5 }}>
                    <IconButton
                        icon={EditIcon}
                        tooltip="Edit rule"
                        onClick={onEdit}
                        color="default"
                    />
                    <IconButton
                        icon={DeleteOutlineIcon}
                        tooltip="Delete rule"
                        onClick={onDelete}
                        color="error"
                    />
                </Stack>
            </Stack>
        </Paper>
    );
};