'use client';

import React, { useState, useRef } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import { Paper, Stack, Chip, Divider } from '@mui/material';

import { IconButton } from '@/components/atoms/Button/IconButton';
import Dropdown from '@/components/atoms/Dropdown';
import {
  AnchorRule as AnchorRuleComponent,
  AnchorRuleRef,
} from '@/features/rules/components/EditorElements/Anchor/AnchorRule';
import type { AnchorRule as AnchorRuleType } from '@/types/extractionRules';
import type { EditRuleProps } from '@/types/rulesComponents';

// Feature-local editor item that mirrors the project's EditRule component.
// Props: same as EditRuleProps (rule, index, onDone, onUpdateField)
const RuleEditMode: React.FC<EditRuleProps> = ({ rule, index, onDone, onUpdateField }) => {
  const isAnchorRule = rule.ruleType === 'anchor';
  const anchorRule = isAnchorRule ? (rule as AnchorRuleType) : undefined;

  const [anchorInputValue, setAnchorInputValue] = useState('');
  const [editingAnchorIndex, setEditingAnchorIndex] = useState<number | null>(null);

  const anchorRuleRef = useRef<AnchorRuleRef | null>(null);

  const handleDone = () => {
    // Apply pending anchor text
    const pendingAnchor = anchorInputValue.trim();
    if (pendingAnchor && isAnchorRule && anchorRule) {
      const aliases = [...(anchorRule.anchorConfig?.aliases || []), pendingAnchor];
      onUpdateField({ anchorConfig: { ...anchorRule.anchorConfig, aliases } });
      setAnchorInputValue('');
    }

    // Ask anchor rule component to apply its pending changes (it exposes this via ref)
    anchorRuleRef.current?.applyPendingChanges?.();

    onDone();
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`Rule ${index + 1}`} size="small" color="primary" variant="outlined" />
            <Chip
              label={`Priority ${index + 1}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Stack>
          <IconButton ariaLabel="Done" onClick={handleDone} color="primary">
            <CheckIcon />
          </IconButton>
        </Stack>

        <Dropdown
          id={`rule-type-${index}`}
          label="Rule Type"
          value={rule.ruleType}
          onChange={v => onUpdateField({ ruleType: v as 'anchor' | 'regex_match' | 'absolute' })}
          options={[
            { value: '', label: <em>Select rule type</em> },
            { value: 'anchor', label: 'Anchor' },
            { value: 'regex_match', label: 'Regex Match' },
            { value: 'absolute', label: 'Absolute Position' },
          ]}
          ariaLabel="Rule Type"
        />

        {isAnchorRule && anchorRule && (
          <>
            <Divider />
            <AnchorRuleComponent
              ref={anchorRuleRef}
              rule={anchorRule}
              onUpdateField={(u: Partial<AnchorRuleType>) => onUpdateField(u)}
              anchors={anchorRule.anchorConfig?.aliases || []}
              onAdd={(anchor: string) => {
                if (!anchor.trim()) return;
                const aliases = [...(anchorRule.anchorConfig?.aliases || []), anchor.trim()];
                onUpdateField({ anchorConfig: { ...anchorRule.anchorConfig, aliases } });
                setAnchorInputValue('');
              }}
              onDelete={(i: number) => {
                const aliases =
                  anchorRule.anchorConfig?.aliases?.filter((_: string, idx: number) => idx !== i) ||
                  [];
                onUpdateField({ anchorConfig: { ...anchorRule.anchorConfig, aliases } });
              }}
              onEdit={(i: number) => {
                const current = anchorRule.anchorConfig?.aliases?.[i];
                if (current) {
                  setAnchorInputValue(current);
                  setEditingAnchorIndex(i);
                }
              }}
              onUpdate={(anchor: string) => {
                if (!anchor.trim() || editingAnchorIndex === null) return;
                const aliases = [...(anchorRule.anchorConfig?.aliases || [])];
                aliases[editingAnchorIndex] = anchor.trim();
                onUpdateField({ anchorConfig: { ...anchorRule.anchorConfig, aliases } });
                setAnchorInputValue('');
                setEditingAnchorIndex(null);
              }}
              onCancel={() => {
                setAnchorInputValue('');
                setEditingAnchorIndex(null);
              }}
              editingIndex={editingAnchorIndex}
              inputValue={anchorInputValue}
              onInputChange={setAnchorInputValue}
            />
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default RuleEditMode;
export { RuleEditMode };
