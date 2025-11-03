import React from 'react';
import { Stack, TextField } from '@mui/material';
import { SearchZoneProps } from './types';

export const SearchZone: React.FC<SearchZoneProps> = ({
    top,
    left,
    right,
    bottom,
    onChange
}) => {
    return (
        <Stack direction="row" spacing={1}>
            <TextField
                size="small"
                type="number"
                label="Top"
                value={top || ''}
                onChange={(e) => onChange('searchZoneTop', e.target.value)}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                placeholder="0-1"
                sx={{ flex: 1 }}
            />
            <TextField
                size="small"
                type="number"
                label="Left"
                value={left || ''}
                onChange={(e) => onChange('searchZoneLeft', e.target.value)}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                placeholder="0-1"
                sx={{ flex: 1 }}
            />
            <TextField
                size="small"
                type="number"
                label="Right"
                value={right || ''}
                onChange={(e) => onChange('searchZoneRight', e.target.value)}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                placeholder="0-1"
                sx={{ flex: 1 }}
            />
            <TextField
                size="small"
                type="number"
                label="Bottom"
                value={bottom || ''}
                onChange={(e) => onChange('searchZoneBottom', e.target.value)}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                placeholder="0-1"
                sx={{ flex: 1 }}
            />
        </Stack>
    );
};