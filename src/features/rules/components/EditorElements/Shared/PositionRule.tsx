'use client';

import React from 'react';

import { Dropdown } from '@/components/atoms/Dropdown/Dropdown';
import { TextInput } from '@/components/atoms/Input';
import Box from '@/components/atoms/Layout/Box';
import Stack from '@/components/atoms/Layout/Stack';
import type { StartingPositionCorner } from '@/types/extractionRules';
import type { PositionProps } from '@/types/rulesComponents';

const PositionRule: React.FC<PositionProps> = ({ positionConfig, onChangePosition, disabled }) => {
  const starting = positionConfig?.startingPosition || 'bottomLeft';

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Dropdown
          label="Starting Position"
          value={starting}
          onChange={val => {
            const sp = val as StartingPositionCorner;
            onChangePosition({ ...positionConfig, startingPosition: sp });
          }}
          options={[
            { value: 'topLeft', label: 'Top Left' },
            { value: 'topRight', label: 'Top Right' },
            { value: 'bottomLeft', label: 'Bottom Left' },
            { value: 'bottomRight', label: 'Bottom Right' },
          ]}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextInput
          size="small"
          type="number"
          label="Offset X"
          value={String(positionConfig?.point?.left ?? 0)}
          onChange={e => {
            const left = Number(e.target.value);
            const currentPoint = positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
            onChangePosition({ point: { ...currentPoint, left } });
          }}
          fullWidth
          inputProps={{ step: 1 }}
          endAdornment={<span>px</span>}
          disabled={!!disabled}
        />
        <TextInput
          size="small"
          type="number"
          label="Offset Y"
          value={String(positionConfig?.point?.top ?? 0)}
          onChange={e => {
            const top = Number(e.target.value);
            const currentPoint = positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
            onChangePosition({ point: { ...currentPoint, top } });
          }}
          fullWidth
          inputProps={{ step: 1 }}
          endAdornment={<span>px</span>}
          disabled={!!disabled}
        />
        <TextInput
          size="small"
          type="number"
          label="Width"
          value={String(Math.abs(positionConfig?.point?.width ?? 0))}
          onChange={e => {
            const width = Number(e.target.value);
            const currentPoint = positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
            onChangePosition({ point: { ...currentPoint, width } });
          }}
          fullWidth
          inputProps={{ step: 1, min: 0 }}
          endAdornment={<span>px</span>}
          disabled={!!disabled}
        />
        <TextInput
          size="small"
          type="number"
          label="Height"
          value={String(Math.abs(positionConfig?.point?.height ?? 0))}
          onChange={e => {
            const height = Number(e.target.value);
            const currentPoint = positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
            onChangePosition({ point: { ...currentPoint, height } });
          }}
          fullWidth
          inputProps={{ step: 1, min: 0 }}
          endAdornment={<span>px</span>}
          disabled={!!disabled}
        />
      </Stack>
    </Box>
  );
};

export default PositionRule;
export { PositionRule };
