import React from 'react';
import { Box, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FieldRulesList } from './FieldRulesList';
import { FieldRule } from '../../types/rulesComponents';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
import { IconButton } from '../common/IconButton';
import { SectionLabel } from '../common/SectionLabel';

interface FieldRulesSectionProps {
    fieldLabel: string;
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
                <SectionLabel>{fieldLabel}</SectionLabel>
                <IconButton
                    icon={AddIcon}
                    tooltip="Add rule"
                    onClick={onAddRule}
                />
            </Stack>
            <FieldRulesList
                rules={rules}
                editingRuleId={editingRuleId}
                draggedRuleIndex={draggedRuleIndex}
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
