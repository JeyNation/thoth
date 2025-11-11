'use client';

import React from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Stack,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';

import { TextButton } from '@/components/atoms/Button/TextButton';
import { TextInput } from '@/components/atoms/Input/TextInput';
import { SubsectionLabel } from '@/components/atoms/Label/SubsectionLabel';
import type { AnchorMatchMode } from '@/types/extractionRules';
import type { AnchorConfigProps } from '@/types/rulesComponents';

const AnchorTextRule: React.FC<AnchorConfigProps> = ({
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
}) => {
  return (
    <Box>
      <SubsectionLabel>Anchor</SubsectionLabel>
      <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" sx={{ mb: 1 }}>
        {anchors.map((anchor, anchorIndex) => (
          <Chip
            key={anchorIndex}
            label={anchor}
            size="small"
            onDelete={() => onDelete(anchorIndex)}
            onClick={() => onEdit(anchorIndex)}
            deleteIcon={<DeleteOutlineIcon fontSize="small" />}
            sx={{ mb: 0.5 }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextInput
          size="small"
          label="Anchor Text"
          fullWidth
          value={inputValue}
          onChange={e => onInputChange}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (editingIndex !== null) {
                onUpdate(inputValue);
              } else {
                onAdd(inputValue);
              }
            }
          }}
        />
        {editingIndex !== null ? (
          <>
            <TextButton size="medium" onClick={() => onUpdate(inputValue)}>
              Update
            </TextButton>
            <TextButton size="medium" onClick={onCancel}>
              Cancel
            </TextButton>
          </>
        ) : (
          <TextButton size="medium" onClick={() => onAdd(inputValue)}>
            Add
          </TextButton>
        )}
      </Stack>

      {/* Match Mode */}
      <FormControl fullWidth size="small" sx={{ mt: 1 }}>
        <InputLabel>Match Mode</InputLabel>
        <Select
          value={rule.anchorConfig?.matchMode || ''}
          label="Match Mode"
          onChange={e =>
            onUpdateField({
              anchorConfig: {
                ...rule.anchorConfig,
                matchMode: e.target.value as AnchorMatchMode,
              },
            })
          }
        >
          <MenuItem value="">
            <em>Select match mode</em>
          </MenuItem>
          <MenuItem value="exact">Exact Match</MenuItem>
          <MenuItem value="startsWith">Starts With</MenuItem>
          <MenuItem value="contains">Contains</MenuItem>
          <MenuItem value="endsWith">Ends With</MenuItem>
        </Select>
      </FormControl>

      {/* Occurrence controls: pick from First/Last and Nth occurrence */}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Pick From</InputLabel>
          <Select
            label="Pick From"
            value={rule.anchorConfig?.instanceFrom || 'start'}
            onChange={e =>
              onUpdateField({
                anchorConfig: {
                  ...rule.anchorConfig,
                  instanceFrom: e.target.value as 'start' | 'end',
                },
              })
            }
          >
            <MenuItem value="start">First</MenuItem>
            <MenuItem value="end">Last</MenuItem>
          </Select>
        </FormControl>
        <TextInput
          size="small"
          type="number"
          label="Occurrence"
          value={String(rule.anchorConfig?.instance ?? 1)}
          onChange={value => {
            const n = Math.max(1, Number(value) || 1);
            onUpdateField({
              anchorConfig: {
                ...rule.anchorConfig,
                instance: n,
              },
            });
          }}
          inputProps={{ step: 1, min: 1 }}
        />
      </Stack>

      {/* Flags (placed after Match Mode within Anchor Text section) */}
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={rule.anchorConfig?.ignoreCase ?? true}
              onChange={e =>
                onUpdateField({
                  anchorConfig: {
                    ...rule.anchorConfig,
                    ignoreCase: e.target.checked,
                  },
                })
              }
            />
          }
          label="Ignore Case"
        />
        <FormControlLabel
          control={
            <Switch
              checked={rule.anchorConfig?.normalizeWhitespace ?? true}
              onChange={e =>
                onUpdateField({
                  anchorConfig: {
                    ...rule.anchorConfig,
                    normalizeWhitespace: e.target.checked,
                  },
                })
              }
            />
          }
          label="Normalize Whitespace"
        />
      </Stack>
    </Box>
  );
};

export default AnchorTextRule;
export { AnchorTextRule };
