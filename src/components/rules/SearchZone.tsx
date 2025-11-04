import React from 'react';
import { Stack, TextField, InputAdornment } from '@mui/material';
import { SearchZoneProps } from '../../types/rulesComponents';

export const SearchZone: React.FC<SearchZoneProps> = ({
    top,
    left,
    right,
    bottom,
    onChange,
    disabled
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

    return (
        <Stack direction="row" spacing={1}>
            <TextField
                size="small"
                type="number"
                label="Left"
                value={toPercent(left)}
                onChange={(e) => onChange('searchZoneLeft', fromPercent(e.target.value))}
                placeholder="0-100"
                disabled={!!disabled}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 1 }
                    }
                }}
                sx={{ flex: 1 }}
            />
            <TextField
                size="small"
                type="number"
                label="Right"
                value={toPercent(right)}
                onChange={(e) => onChange('searchZoneRight', fromPercent(e.target.value))}
                placeholder="0-100"
                disabled={!!disabled}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 1 }
                    }
                }}
                sx={{ flex: 1 }}
            />
            <TextField
                size="small"
                type="number"
                label="Top"
                value={toPercent(top)}
                onChange={(e) => onChange('searchZoneTop', fromPercent(e.target.value))}
                placeholder="0-100"
                disabled={!!disabled}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 1 }
                    }
                }}
                sx={{ flex: 1 }}
            />
            <TextField
                size="small"
                type="number"
                label="Bottom"
                value={toPercent(bottom)}
                onChange={(e) => onChange('searchZoneBottom', fromPercent(e.target.value))}
                placeholder="0-100"
                disabled={!!disabled}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 1 }
                    }
                }}
                sx={{ flex: 1 }}
            />
        </Stack>
    );
};