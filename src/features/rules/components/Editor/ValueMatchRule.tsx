'use client';

import React, { useRef, useState } from 'react';

import { TextButton } from '@/components/atoms/Button/TextButton';
import { SubsectionLabel } from '@/components/atoms/Label/SubsectionLabel';
import Box from '@/components/atoms/Layout/Box';
import Stack from '@/components/atoms/Layout/Stack';
import { RegexPatterns, RegexPatternsRef } from '@/components/rules/RegexPatterns';
import type { ParserPattern } from '@/types/extractionRules';
import type { ValueMatchProps } from '@/types/rulesComponents';

const ValueMatchRule: React.FC<ValueMatchProps> = ({ rule, onUpdateField, disabled }) => {
  const regexRef = useRef<RegexPatternsRef | null>(null);
  const [draggedPatternIndex, setDraggedPatternIndex] = useState<number | null>(null);

  const patterns: ParserPattern[] = rule.parserConfig?.patterns || [];

  type PatternInput = string | { regex: string; label?: string };

  return (
    <Box sx={{ mt: 2 }}>
      <SubsectionLabel>Value Match</SubsectionLabel>
      <RegexPatterns
        ref={regexRef}
        patterns={patterns}
        onAdd={(pattern: PatternInput) => {
          const newPattern =
            typeof pattern === 'string'
              ? { regex: pattern, priority: (patterns.length || 0) + 1 }
              : {
                  regex: pattern.regex,
                  label: pattern.label,
                  priority: (patterns.length || 0) + 1,
                };
          onUpdateField({
            parserConfig: { ...rule.parserConfig, patterns: [...patterns, newPattern] },
          });
        }}
        onUpdate={(index: number, pattern: PatternInput) => {
          const copy = [...patterns];
          const existing = copy[index];
          if (!existing) return;
          const newRegex = typeof pattern === 'string' ? pattern : pattern.regex;
          const newLabel = typeof pattern === 'string' ? existing.label : pattern.label;
          copy[index] = { ...existing, regex: newRegex, label: newLabel };
          onUpdateField({ parserConfig: { ...rule.parserConfig, patterns: copy } });
        }}
        onDelete={(index: number) => {
          const copy = patterns
            .filter((_: unknown, i: number) => i !== index)
            .map((p: ParserPattern, i: number) => ({ ...p, priority: i + 1 }));
          onUpdateField({ parserConfig: { ...(rule.parserConfig ?? {}), patterns: copy } });
        }}
        onDragStart={(index: number) => setDraggedPatternIndex(index)}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={(dropIndex: number) => {
          if (draggedPatternIndex === null || draggedPatternIndex === dropIndex) {
            setDraggedPatternIndex(null);
            return;
          }
          const copy = [...patterns];
          const [dragged] = copy.splice(draggedPatternIndex, 1);
          copy.splice(dropIndex, 0, dragged);
          const reordered = copy.map((p: ParserPattern, idx: number) => ({
            ...p,
            priority: idx + 1,
          }));
          onUpdateField({ parserConfig: { ...(rule.parserConfig ?? {}), patterns: reordered } });
          setDraggedPatternIndex(null);
        }}
        isDragged={index => draggedPatternIndex === index}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <TextButton
          size="medium"
          onClick={() => regexRef.current?.applyPendingChanges()}
          disabled={!!disabled}
        >
          Apply Pending
        </TextButton>
      </Stack>
    </Box>
  );
};

export default ValueMatchRule;
export { ValueMatchRule };
