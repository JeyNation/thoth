import React, { forwardRef } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Box, Stack } from '@mui/material';

import { FieldRulesList, FieldRulesListRef } from './FieldRulesList';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
import { FieldRule } from '../../types/rulesComponents';
import { IconButton } from '../ui/Button/IconButton';
import { SectionLabel } from '../ui/Label/SectionLabel';

export type { FieldRulesListRef };

interface FieldRulesSectionProps {
  fieldLabel: string;
  rules: FieldRule[];
  editingRuleId: string | null;
  draggedRuleIndex: number | null;
  onAddRule: () => void;
  onEditRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onDoneEditing: (ruleId: string) => void;
  onUpdateField: (
    ruleId: string,
    updates: Partial<AnchorRule | RegexMatchRule | AbsoluteRule>,
  ) => void;
  onRuleDragStart: (index: number) => void;
  onRuleDragOver: (e: React.DragEvent) => void;
  onRuleDrop: (index: number) => void;
}

export const FieldRulesSection = forwardRef<FieldRulesListRef, FieldRulesSectionProps>(
  (
    {
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
      onRuleDrop,
    },
    ref,
  ) => {
    return (
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <SectionLabel>{fieldLabel}</SectionLabel>
          <IconButton ariaLabel="Add rule" onClick={onAddRule}>
            <AddIcon />
          </IconButton>
        </Stack>
        <FieldRulesList
          ref={ref}
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
  },
);

FieldRulesSection.displayName = 'FieldRulesSection';
