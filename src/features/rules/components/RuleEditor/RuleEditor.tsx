'use client';

import React, { useState } from 'react';

import { Stack } from '@mui/material';

import { EditRule } from '@/components/rules/EditRule';
import { ViewRule } from '@/components/rules/ViewRule';
import Button from '@/components/ui/Button/Button';
import type { FieldRule } from '@/types/rulesComponents';

export interface RuleEditorProps {
  rules: FieldRule[];
  onChange: (rules: FieldRule[]) => void;
}

const makeEmptyAnchorRule = (index: number): FieldRule => ({
  id: `rule-${Date.now()}-${index}`,
  priority: index + 1,
  ruleType: 'anchor',
  // Minimal defaults for anchor rule shape
  anchorConfig: {
    aliases: [],
    searchZone: { top: 0, left: 0, right: 0, bottom: 0 },
    instance: 0,
  },
  positionConfig: {
    point: { width: 0, height: 0, top: 0, left: 0 },
  },
  parserConfig: {},
});

const RuleEditor: React.FC<RuleEditorProps> = ({ rules, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const next = [...rules, makeEmptyAnchorRule(rules.length)];
    onChange(next);
    setEditingIndex(next.length - 1);
  };

  const handleUpdate = (index: number, updates: Partial<FieldRule>) => {
    const next = rules.map((r, i) => (i === index ? ({ ...r, ...updates } as FieldRule) : r));
    onChange(next);
  };

  const handleDelete = (index: number) => {
    const next = rules.filter((_, i) => i !== index).map((r, i) => ({ ...r, priority: i + 1 }));
    onChange(next);
    if (editingIndex !== null && editingIndex >= next.length) setEditingIndex(null);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button onClick={handleAdd} ariaLabel="Add rule">
          Add rule
        </Button>
      </Stack>

      <Stack spacing={1}>
        {rules.map((rule, index) => (
          <div key={rule.id}>
            {editingIndex === index ? (
              <EditRule
                rule={rule}
                index={index}
                onDone={() => setEditingIndex(null)}
                onUpdateField={u => handleUpdate(index, u)}
              />
            ) : (
              <ViewRule
                rule={rule}
                index={index}
                onEdit={() => setEditingIndex(index)}
                onDelete={() => handleDelete(index)}
                onDragStart={() => {}}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {}}
                isDragged={false}
              />
            )}
          </div>
        ))}
      </Stack>
    </Stack>
  );
};

export default RuleEditor;
export { RuleEditor };
