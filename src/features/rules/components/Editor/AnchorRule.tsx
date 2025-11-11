import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';

import { Box } from '@mui/material';

import { SubsectionLabel } from '@/components/atoms/Label/SubsectionLabel';
import { RegexPatterns, RegexPatternsRef } from '@/components/rules/RegexPatterns';
import { SearchZoneRule, PositionRule } from '@/features/rules/components/Editor';
import { AnchorTextRule } from '@/features/rules/components/Editor/AnchorTextRule';
import type { PositionConfig } from '@/types/extractionRules';
import { AnchorConfigProps } from '@/types/rulesComponents';

export interface AnchorRuleRef {
  applyPendingChanges: () => void;
  getPendingChanges: () => {
    pendingPattern?: string | { regex: string; label?: string };
    pendingPatternEdit?: { index: number; pattern: string | { regex: string; label?: string } };
  };
}

export const AnchorRule = forwardRef<AnchorRuleRef, AnchorConfigProps>(function AnchorRule(
  {
    rule,
    onUpdateField,
    anchors,
    onAdd,
    onDelete,
    onEdit,
    onUpdate,
    onCancel,
    editingIndex,
    inputValue,
    onInputChange,
  },
  ref,
) {
  const regexPatternsRef = useRef<RegexPatternsRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      applyPendingChanges: () => {
        regexPatternsRef.current?.applyPendingChanges();
      },
      getPendingChanges: () => {
        return regexPatternsRef.current?.getPendingChanges() || {};
      },
    }),
    [],
  );
  const [draggedPatternIndex, setDraggedPatternIndex] = useState<number | null>(null);

  const sz = rule.anchorConfig?.searchZone || { top: 0, bottom: 1, left: 0, right: 1 };

  return (
    <Box>
      <AnchorTextRule
        rule={rule}
        onUpdateField={onUpdateField}
        anchors={anchors}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
        onUpdate={onUpdate}
        onCancel={onCancel}
        editingIndex={editingIndex}
        inputValue={inputValue}
        onInputChange={onInputChange}
      />

      <Box sx={{ mt: 2 }}>
        <SubsectionLabel>Search Zone</SubsectionLabel>
        <SearchZoneRule
          top={String(sz.top ?? 0)}
          left={String(sz.left ?? 0)}
          right={String(sz.right ?? 1)}
          bottom={String(sz.bottom ?? 1)}
          pageScope={rule.anchorConfig?.pageScope}
          showPages={true}
          onChange={(field: string, value: string) => {
            if (field === 'pageScope') {
              onUpdateField({
                anchorConfig: {
                  ...rule.anchorConfig,
                  pageScope: value as 'first' | 'last' | 'any',
                },
              });
              return;
            }

            const fieldMap: Record<string, string> = {
              searchZoneTop: 'top',
              searchZoneLeft: 'left',
              searchZoneRight: 'right',
              searchZoneBottom: 'bottom',
            };
            const actualField = fieldMap[field] || field;
            const numValue = parseFloat(value);
            onUpdateField({
              anchorConfig: {
                ...rule.anchorConfig,
                searchZone: {
                  ...rule.anchorConfig?.searchZone,
                  [actualField]: isNaN(numValue) ? 0 : numValue,
                },
              },
            });
          }}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <SubsectionLabel>Position</SubsectionLabel>
        <PositionRule
          positionConfig={rule.positionConfig}
          disabled={false}
          onChangePosition={(updates: Partial<PositionConfig>) =>
            onUpdateField({
              positionConfig: {
                ...rule.positionConfig,
                ...updates,
              },
            })
          }
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <SubsectionLabel>Regex Patterns</SubsectionLabel>
        <RegexPatterns
          ref={regexPatternsRef}
          patterns={rule.parserConfig?.patterns || []}
          onAdd={pattern => {
            const patterns = [
              ...(rule.parserConfig?.patterns || []),
              {
                regex: typeof pattern === 'string' ? pattern : pattern.regex,
                label: typeof pattern === 'string' ? undefined : pattern.label,
                priority: (rule.parserConfig?.patterns?.length || 0) + 1,
              },
            ];
            onUpdateField({
              parserConfig: {
                ...rule.parserConfig,
                patterns,
              },
            });
          }}
          onUpdate={(index, pattern) => {
            const patterns = [...(rule.parserConfig?.patterns || [])];
            const existing = patterns[index];
            if (!existing) return;

            const newRegex = typeof pattern === 'string' ? pattern : pattern.regex;
            let newLabel: string | undefined;

            if (typeof pattern === 'string') {
              if (existing.label && newRegex !== existing.regex) {
                newLabel = undefined;
              } else {
                newLabel = existing.label;
              }
            } else {
              newLabel = pattern.label;
            }

            patterns[index] = { ...existing, regex: newRegex, label: newLabel };
            onUpdateField({
              parserConfig: {
                ...rule.parserConfig,
                patterns,
              },
            });
          }}
          onDelete={(index: number) => {
            const patterns =
              rule.parserConfig?.patterns?.filter((_, i: number) => i !== index) || [];
            const reordered = patterns.map((p, idx) => ({ ...p, priority: idx + 1 }));
            onUpdateField({
              parserConfig: {
                ...rule.parserConfig,
                patterns: reordered,
              },
            });
          }}
          onDragStart={(index: number) => setDraggedPatternIndex(index)}
          onDragOver={e => e.preventDefault()}
          onDrop={(dropIndex: number) => {
            if (draggedPatternIndex === null || draggedPatternIndex === dropIndex) {
              setDraggedPatternIndex(null);
              return;
            }
            const patterns = [...(rule.parserConfig?.patterns || [])];
            const [dragged] = patterns.splice(draggedPatternIndex, 1);
            patterns.splice(dropIndex, 0, dragged);
            const reordered = patterns.map((p, idx) => ({ ...p, priority: idx + 1 }));
            onUpdateField({
              parserConfig: {
                ...rule.parserConfig,
                patterns: reordered,
              },
            });
            setDraggedPatternIndex(null);
          }}
          isDragged={(index: number) => draggedPatternIndex === index}
        />
      </Box>
    </Box>
  );
});

export default AnchorRule;
