import React, { useRef, useImperativeHandle, forwardRef } from 'react';

import { Stack } from '@mui/material';

import { RuleSection } from '@/features/rules/components/Rules';

import { EditRule, EditRuleRef } from './EditRule';
import { ViewRule } from './ViewRule';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
import { FieldRule } from '../../types/rulesComponents';
import { EmptyDataIndicator } from '../atoms/Feedback/Indicator/EmptyDataIndicator';

export interface FieldRulesListRef {
  applyAllPendingChanges: () => void;
  getAllPendingChanges: () => Record<
    string,
    {
      pendingAnchor?: string;
      pendingAnchorEdit?: { index: number; value: string };
      pendingPattern?: string | { regex: string; label?: string };
      pendingPatternEdit?: { index: number; pattern: string | { regex: string; label?: string } };
    }
  >;
}

interface FieldRulesListProps {
  rules: FieldRule[];
  editingRuleId: string | null;
  draggedRuleIndex: number | null;
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
  onChangeRules?: (rules: FieldRule[]) => void;
}

export const FieldRulesList = forwardRef<FieldRulesListRef, FieldRulesListProps>(
  (
    {
      rules,
      editingRuleId,
      draggedRuleIndex,
      onEditRule,
      onDeleteRule,
      onDoneEditing,
      onUpdateField,
      onChangeRules,
      onRuleDragStart,
      onRuleDragOver,
      onRuleDrop,
    },
    ref,
  ) => {
    const editRuleRefs = useRef<Map<string, EditRuleRef>>(new Map());

    // Expose method to apply all pending changes
    useImperativeHandle(
      ref,
      () => ({
        applyAllPendingChanges: () => {
          editRuleRefs.current.forEach((editRuleRef, ruleId) => {
            editRuleRef.applyPendingChanges();
          });
        },
        getAllPendingChanges: () => {
          const allPending: Record<
            string,
            {
              pendingAnchor?: string;
              pendingAnchorEdit?: { index: number; value: string };
              pendingPattern?: string | { regex: string; label?: string };
              pendingPatternEdit?: {
                index: number;
                pattern: string | { regex: string; label?: string };
              };
            }
          > = {};
          editRuleRefs.current.forEach((editRuleRef, ruleId) => {
            const pending = editRuleRef.getPendingChanges();
            if (
              pending.pendingAnchor ||
              pending.pendingAnchorEdit ||
              pending.pendingPattern ||
              pending.pendingPatternEdit
            ) {
              allPending[ruleId] = pending;
            }
          });
          return allPending;
        },
      }),
      [],
    );
    if (rules.length === 0) {
      return (
        <EmptyDataIndicator
          title="No rules defined for this field."
          description='Click "+" to create your first rule'
        />
      );
    }

    return (
      <Stack spacing={1.5} sx={{ mb: 1.5 }}>
        <RuleSection rules={rules} onChange={onChangeRules!} />
      </Stack>
    );
  },
);

FieldRulesList.displayName = 'FieldRulesList';
