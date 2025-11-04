import React from 'react';
import { Stack } from '@mui/material';
import { ViewRule } from './ViewRule';
import { EditRule } from './EditRule';
import { FieldRule } from '../../types/rulesComponents';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
import { EmptyState } from '../common/EmptyState';

interface FieldRulesListProps {
    rules: FieldRule[];
    editingRuleId: string | null;
    draggedRuleIndex: number | null;
    onEditRule: (ruleId: string) => void;
    onDeleteRule: (ruleId: string) => void;
    onDoneEditing: (ruleId: string) => void;
    onUpdateField: (ruleId: string, updates: Partial<AnchorRule | RegexMatchRule | AbsoluteRule>) => void;
    onRuleDragStart: (index: number) => void;
    onRuleDragOver: (e: React.DragEvent) => void;
    onRuleDrop: (index: number) => void;
}

export const FieldRulesList: React.FC<FieldRulesListProps> = ({
    rules,
    editingRuleId,
    draggedRuleIndex,
    onEditRule,
    onDeleteRule,
    onDoneEditing,
    onUpdateField,
    onRuleDragStart,
    onRuleDragOver,
    onRuleDrop
}) => {
    if (rules.length === 0) {
        return <EmptyState 
            sx={{ pb: 6 }}
            message="No rules defined for this field." 
            description='Click "+" to create your first rule' />;
    }

    return (
        <Stack spacing={1.5} sx={{ mb: 1.5 }}>
            {rules.map((rule, index) => {
                const isEditingThisRule = editingRuleId === rule.id;
                return (
                    <React.Fragment key={rule.id}>
                        {!isEditingThisRule && (
                            <ViewRule
                                rule={rule}
                                index={index}
                                onEdit={() => onEditRule(rule.id)}
                                onDelete={() => onDeleteRule(rule.id)}
                                onDragStart={() => onRuleDragStart(index)}
                                onDragOver={onRuleDragOver}
                                onDrop={() => onRuleDrop(index)}
                                isDragged={draggedRuleIndex === index}
                            />
                        )}
                        
                        {isEditingThisRule && (
                            <EditRule
                                rule={rule}
                                index={index}
                                onDone={() => onDoneEditing(rule.id)}
                                onUpdateField={(updates) => onUpdateField(rule.id, updates)}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </Stack>
    );
};
