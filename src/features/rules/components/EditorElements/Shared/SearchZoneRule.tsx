'use client';

import React from 'react';

import { Dropdown } from '@/components/atoms/Dropdown/Dropdown';
import { TextInput } from '@/components/atoms/Input';
import Box from '@/components/atoms/Layout/Box';
import Stack from '@/components/atoms/Layout/Stack';
import { SearchZoneProps } from '@/types/rulesComponents';

const SearchZoneRule: React.FC<SearchZoneProps> = ({
  top,
  left,
  right,
  bottom,
  pageScope,
  onChange,
  disabled,
}) => {
  // Helpers: convert stored 0-1 strings to percent display and back
  const toPercent = (val?: string) => {
    const num = parseFloat(val ?? '');
    if (isNaN(num)) return '';
    return String(Math.round(num * 100));
  };
  const fromPercent = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    const clamped = Math.max(0, Math.min(100, num));
    // keep two decimals when converting back to 0-1
    return String(Math.round((clamped / 100) * 100) / 100);
  };

  // Preset detection logic (fractions + computePreset)
  const FRACTIONS: Array<{ label: '1/2' | '1/3' | '1/4'; value: number }> = [
    { label: '1/2', value: 1 / 2 },
    { label: '1/3', value: 1 / 3 },
    { label: '1/4', value: 1 / 4 },
  ];

  const fractionLabelToValue = (label: '1/2' | '1/3' | '1/4'): number => {
    return FRACTIONS.find(f => f.label === label)!.value;
  };

  const epsilon = 0.0001;
  const approxEq = (a: number, b: number) => Math.abs(a - b) < epsilon;

  const computePresetAndFraction = (sz: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => {
    const t = sz.top,
      b = sz.bottom,
      l = sz.left,
      r = sz.right;
    if (approxEq(t, 0) && approxEq(b, 1) && approxEq(l, 0) && approxEq(r, 1)) {
      return { preset: 'entire' as const, fraction: null as null | '1/2' | '1/3' | '1/4' };
    }
    for (const f of FRACTIONS) {
      if (approxEq(t, 0) && approxEq(b, f.value) && approxEq(l, 0) && approxEq(r, 1)) {
        return { preset: 'top' as const, fraction: f.label };
      }
      if (approxEq(t, 1 - f.value) && approxEq(b, 1) && approxEq(l, 0) && approxEq(r, 1)) {
        return { preset: 'bottom' as const, fraction: f.label };
      }
      if (approxEq(l, 0) && approxEq(r, f.value) && approxEq(t, 0) && approxEq(b, 1)) {
        return { preset: 'left' as const, fraction: f.label };
      }
      if (approxEq(l, 1 - f.value) && approxEq(r, 1) && approxEq(t, 0) && approxEq(b, 1)) {
        return { preset: 'right' as const, fraction: f.label };
      }
    }
    return { preset: 'custom' as const, fraction: null as null | '1/2' | '1/3' | '1/4' };
  };

  const szNumeric = {
    top: Number(top ?? 0),
    bottom: Number(bottom ?? 1),
    left: Number(left ?? 0),
    right: Number(right ?? 1),
  };

  const detected = computePresetAndFraction(szNumeric);
  const [zonePreset, setZonePreset] = React.useState<
    'entire' | 'top' | 'bottom' | 'left' | 'right' | 'custom'
  >(() => detected.preset);
  const [zoneFraction, setZoneFraction] = React.useState<'1/2' | '1/3' | '1/4'>(
    () => detected.fraction || '1/2',
  );

  const applyPreset = (
    mode: 'top' | 'bottom' | 'left' | 'right',
    fractionLabel: '1/2' | '1/3' | '1/4',
  ) => {
    const f = fractionLabelToValue(fractionLabel);
    const presets: Record<
      'top' | 'bottom' | 'left' | 'right',
      { top: number; bottom: number; left: number; right: number }
    > = {
      top: { top: 0, bottom: f, left: 0, right: 1 },
      bottom: { top: 1 - f, bottom: 1, left: 0, right: 1 },
      left: { top: 0, bottom: 1, left: 0, right: f },
      right: { top: 0, bottom: 1, left: 1 - f, right: 1 },
    };
    const p = presets[mode];
    // call onChange for each field
    onChange('searchZoneTop', String(p.top));
    onChange('searchZoneBottom', String(p.bottom));
    onChange('searchZoneLeft', String(p.left));
    onChange('searchZoneRight', String(p.right));
  };

  // Keep preset in sync if values change externally; don't override if user forced custom
  React.useEffect(() => {
    const { preset, fraction } = computePresetAndFraction(szNumeric);
    if (zonePreset !== 'custom' && preset !== zonePreset) {
      setZonePreset(preset);
    }
    if (zonePreset !== 'custom' && fraction && fraction !== zoneFraction) {
      setZoneFraction(fraction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, bottom, left, right]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Dropdown
          label="Pages"
          value={pageScope ?? 'first'}
          onChange={val => {
            onChange('pageScope', val);
          }}
          options={[
            { value: 'first', label: 'First page' },
            { value: 'last', label: 'Last page' },
            { value: 'any', label: 'Any page' },
          ]}
        />
        <Dropdown
          label="Zone Preset"
          value={zonePreset}
          onChange={val => {
            const mode = val as 'entire' | 'top' | 'bottom' | 'left' | 'right' | 'custom';
            setZonePreset(mode);
            if (mode === 'custom') return;
            if (mode === 'entire') {
              onChange('searchZoneTop', String(0));
              onChange('searchZoneBottom', String(1));
              onChange('searchZoneLeft', String(0));
              onChange('searchZoneRight', String(1));
              return;
            }
            applyPreset(mode as 'top' | 'bottom' | 'left' | 'right', zoneFraction);
          }}
          options={[
            { value: 'entire', label: 'Entire Page' },
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'custom', label: 'Custom' },
          ]}
        />

        <Dropdown
          label="Split"
          value={zoneFraction}
          disabled={zonePreset === 'custom' || zonePreset === 'entire'}
          onChange={val => {
            const frac = val as '1/2' | '1/3' | '1/4';
            setZoneFraction(frac);
            if (zonePreset !== 'custom' && zonePreset !== 'entire') {
              applyPreset(zonePreset as 'top' | 'bottom' | 'left' | 'right', frac);
            }
          }}
          options={[
            { value: '1/2', label: '1/2' },
            { value: '1/3', label: '1/3' },
            { value: '1/4', label: '1/4' },
          ]}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextInput
          size="small"
          type="number"
          label="Left"
          value={toPercent(left)}
          onChange={e => {
            if (zonePreset !== 'custom') setZonePreset('custom');
            onChange('searchZoneLeft', fromPercent((e.target as HTMLInputElement).value));
          }}
          fullWidth
          disabled={!!disabled || zonePreset !== 'custom'}
          inputProps={{ placeholder: '0-100', min: 0, max: 100, step: 1 }}
          endAdornment={<span>%</span>}
        />

        <TextInput
          size="small"
          type="number"
          label="Right"
          value={toPercent(right)}
          onChange={e => {
            if (zonePreset !== 'custom') setZonePreset('custom');
            onChange('searchZoneRight', fromPercent((e.target as HTMLInputElement).value));
          }}
          fullWidth
          disabled={!!disabled || zonePreset !== 'custom'}
          inputProps={{ placeholder: '0-100', min: 0, max: 100, step: 1 }}
          endAdornment={<span>%</span>}
        />

        <TextInput
          size="small"
          type="number"
          label="Top"
          value={toPercent(top)}
          onChange={e => {
            if (zonePreset !== 'custom') setZonePreset('custom');
            onChange('searchZoneTop', fromPercent((e.target as HTMLInputElement).value));
          }}
          fullWidth
          disabled={!!disabled || zonePreset !== 'custom'}
          inputProps={{ placeholder: '0-100', min: 0, max: 100, step: 1 }}
          endAdornment={<span>%</span>}
        />

        <TextInput
          size="small"
          type="number"
          label="Bottom"
          value={toPercent(bottom)}
          onChange={e => {
            if (zonePreset !== 'custom') setZonePreset('custom');
            onChange('searchZoneBottom', fromPercent((e.target as HTMLInputElement).value));
          }}
          fullWidth
          disabled={!!disabled || zonePreset !== 'custom'}
          inputProps={{ placeholder: '0-100', min: 0, max: 100, step: 1 }}
          endAdornment={<span>%</span>}
        />
      </Stack>
    </Box>
  );
};

export default SearchZoneRule;
export { SearchZoneRule };
