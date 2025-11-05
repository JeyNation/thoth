import React, { useEffect, useMemo, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import { Stack, Chip, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { AnchorConfigProps } from '../../types/rulesComponents';
import { SubsectionLabel } from '../common/SubsectionLabel';
import { TextInput } from '../common/TextInput';
import { TextButton } from '../common/TextButton';
import { SearchZone } from './SearchZone';
import { RegexPatterns, RegexPatternsRef } from './RegexPatterns';

export interface AnchorConfigRef {
    applyPendingChanges: () => void;
    getPendingChanges: () => {
        pendingPattern?: string | { regex: string; label?: string };
        pendingPatternEdit?: { index: number; pattern: string | { regex: string; label?: string } };
    };
}

export const AnchorConfig = forwardRef<AnchorConfigRef, AnchorConfigProps>(({
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
    onInputChange
}, ref) => {
    const regexPatternsRef = useRef<RegexPatternsRef>(null);

    // Expose method to apply pending changes
    useImperativeHandle(ref, () => ({
        applyPendingChanges: () => {
            regexPatternsRef.current?.applyPendingChanges();
        },
        getPendingChanges: () => {
            return regexPatternsRef.current?.getPendingChanges() || {};
        }
    }), []);
    const [draggedPatternIndex, setDraggedPatternIndex] = useState<number | null>(null);

    // --- Search Zone preset state (fix: allow selecting Custom even if values match a preset) ---
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

    const computePresetAndFraction = (sz: { top: number; bottom: number; left: number; right: number }) => {
        const t = sz.top, b = sz.bottom, l = sz.left, r = sz.right;
        // Entire page first
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

    const currentSZ = rule.anchorConfig?.searchZone || { top: 0, bottom: 1, left: 0, right: 1 };
    const detected = computePresetAndFraction(currentSZ);
    const [zonePreset, setZonePreset] = useState<'entire' | 'top' | 'bottom' | 'left' | 'right' | 'custom'>(
        () => detected.preset
    );
    const [zoneFraction, setZoneFraction] = useState<'1/2' | '1/3' | '1/4'>(
        () => detected.fraction || '1/2'
    );

    const applyPreset = (mode: 'top' | 'bottom' | 'left' | 'right', fractionLabel: '1/2' | '1/3' | '1/4') => {
        const f = fractionLabelToValue(fractionLabel);
        const presets: Record<'top' | 'bottom' | 'left' | 'right', { top: number; bottom: number; left: number; right: number }>
            = {
                top: { top: 0, bottom: f, left: 0, right: 1 },
                bottom: { top: 1 - f, bottom: 1, left: 0, right: 1 },
                left: { top: 0, bottom: 1, left: 0, right: f },
                right: { top: 0, bottom: 1, left: 1 - f, right: 1 },
            };
        const p = presets[mode];
        onUpdateField({
            anchorConfig: {
                ...rule.anchorConfig,
                searchZone: { ...rule.anchorConfig?.searchZone, ...p }
            }
        });
    };

    // Keep preset in sync if values change externally; don't override if user forced custom
    useEffect(() => {
        const { preset, fraction } = computePresetAndFraction(currentSZ);
        if (zonePreset !== 'custom' && preset !== zonePreset) {
            setZonePreset(preset);
        }
        if (zonePreset !== 'custom' && fraction && fraction !== zoneFraction) {
            setZoneFraction(fraction);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSZ.top, currentSZ.bottom, currentSZ.left, currentSZ.right]);

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
                    label="Anchor Text"
                    fullWidth
                    value={inputValue}
                    onChange={onInputChange}
                    onKeyPress={(e) => {
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
                        <TextButton
                            size="medium"
                            onClick={() => onUpdate(inputValue)}
                            startIcon={<CheckIcon fontSize="small" />}
                            sx={{ px: 2.5, minWidth: 105 }}
                        >
                            Update
                        </TextButton>
                        <TextButton
                            size="medium"
                            variant="outlined"
                            onClick={onCancel}
                            startIcon={<CloseIcon fontSize="small" />}
                            sx={{ px: 2.5, minWidth: 105 }}
                        >
                            Cancel
                        </TextButton>
                    </>
                ) : (
                    <TextButton
                        size="medium"
                        onClick={() => onAdd(inputValue)}
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{ minWidth: 80 }}
                    >
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
                    onChange={(e) => onUpdateField({
                        anchorConfig: {
                            ...rule.anchorConfig,
                            matchMode: e.target.value as any
                        }
                    })}
                >
                    <MenuItem value=""><em>Select match mode</em></MenuItem>
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
                        value={(rule.anchorConfig as any)?.instanceFrom || 'start'}
                        onChange={(e) => onUpdateField({
                            anchorConfig: {
                                ...rule.anchorConfig,
                                instanceFrom: e.target.value as any
                            }
                        })}
                    >
                        <MenuItem value="start">First</MenuItem>
                        <MenuItem value="end">Last</MenuItem>
                    </Select>
                </FormControl>
                <TextInput
                    type="number"
                    label="Occurrence"
                    value={String(rule.anchorConfig?.instance ?? 1)}
                    onChange={(value) => {
                        const n = Math.max(1, Number(value) || 1);
                        onUpdateField({
                            anchorConfig: {
                                ...rule.anchorConfig,
                                instance: n
                            }
                        });
                    }}
                    inputProps={{ step: 1, min: 1 }}
                    sx={{ flex: 1 }}
                />
            </Stack>
            {/* Flags (placed after Match Mode within Anchor Text section) */}
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={rule.anchorConfig?.ignoreCase ?? true}
                            onChange={(e) => onUpdateField({
                                anchorConfig: {
                                    ...rule.anchorConfig,
                                    ignoreCase: e.target.checked
                                }
                            })}
                        />
                    }
                    label="Ignore Case"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={rule.anchorConfig?.normalizeWhitespace ?? true}
                            onChange={(e) => onUpdateField({
                                anchorConfig: {
                                    ...rule.anchorConfig,
                                    normalizeWhitespace: e.target.checked
                                }
                            })}
                        />
                    }
                    label="Normalize Whitespace"
                />
            </Stack>

            {/* Search Zone */}
            <Box sx={{ mt: 2 }}>
                <SubsectionLabel>Search Zone</SubsectionLabel>

                {/* Pages to search */}
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Pages</InputLabel>
                    <Select
                        label="Pages"
                        value={(rule.anchorConfig as any)?.pageScope || 'first'}
                        onChange={(e) => onUpdateField({
                            anchorConfig: {
                                ...rule.anchorConfig,
                                pageScope: e.target.value as any
                            }
                        })}
                    >
                        <MenuItem value="first">First page</MenuItem>
                        <MenuItem value="last">Last page</MenuItem>
                        <MenuItem value="any">Any page</MenuItem>
                    </Select>
                </FormControl>

                {/* Preset selector + Fraction selector */}
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                        <InputLabel>Zone Preset</InputLabel>
                        <Select
                            label="Zone Preset"
                            value={zonePreset}
                            onChange={(e) => {
                                const mode = e.target.value as 'entire' | 'top' | 'bottom' | 'left' | 'right' | 'custom';
                                setZonePreset(mode);
                                if (mode === 'custom') return; // Don't override values; just enable editing
                                if (mode === 'entire') {
                                    onUpdateField({
                                        anchorConfig: {
                                            ...rule.anchorConfig,
                                            searchZone: { top: 0, bottom: 1, left: 0, right: 1 }
                                        }
                                    });
                                    return;
                                }
                                applyPreset(mode, zoneFraction);
                            }}
                        >
                            <MenuItem value="entire">Entire Page</MenuItem>
                            <MenuItem value="top">Top</MenuItem>
                            <MenuItem value="bottom">Bottom</MenuItem>
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                        <InputLabel>Split</InputLabel>
                        <Select
                            label="Split"
                            value={zoneFraction}
                            disabled={zonePreset === 'custom' || zonePreset === 'entire'}
                            displayEmpty
                            renderValue={(value) => (zonePreset === 'custom' || zonePreset === 'entire') ? 'N/A' : (value as string)}
                            onChange={(e) => {
                                const frac = e.target.value as '1/2' | '1/3' | '1/4';
                                setZoneFraction(frac);
                                if (zonePreset !== 'custom') {
                                    // Re-apply current preset with the new fraction
                                    if (zonePreset !== 'entire')
                                        applyPreset(zonePreset as 'top' | 'bottom' | 'left' | 'right', frac);
                                }
                            }}
                        >
                            <MenuItem value="1/2">1/2</MenuItem>
                            <MenuItem value="1/3">1/3</MenuItem>
                            <MenuItem value="1/4">1/4</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                {/* Inputs (disabled when preset != custom) */}
                {(() => {
                    const sz = rule.anchorConfig?.searchZone || { top: 0, bottom: 1, left: 0, right: 1 };
                    return (
                        <SearchZone
                            top={String(sz.top ?? 0)}
                            left={String(sz.left ?? 0)}
                            right={String(sz.right ?? 1)}
                            bottom={String(sz.bottom ?? 1)}
                            disabled={zonePreset !== 'custom'}
                            onChange={(field: string, value: string) => {
                                const fieldMap: Record<string, string> = {
                                    'searchZoneTop': 'top',
                                    'searchZoneLeft': 'left',
                                    'searchZoneRight': 'right',
                                    'searchZoneBottom': 'bottom'
                                };
                                const actualField = fieldMap[field] || field;
                                const numValue = parseFloat(value);
                                // As soon as user edits, ensure preset shows 'custom'
                                if (zonePreset !== 'custom') setZonePreset('custom');
                                onUpdateField({
                                    anchorConfig: {
                                        ...rule.anchorConfig,
                                        searchZone: {
                                            ...rule.anchorConfig?.searchZone,
                                            [actualField]: isNaN(numValue) ? 0 : numValue
                                        }
                                    }
                                });
                            }}
                        />
                    );
                })()}
            </Box>

            

            {/* Position Configuration */}
            <Box sx={{ mt: 2 }}>
                <SubsectionLabel>Position</SubsectionLabel>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Starting Position</InputLabel>
                    <Select
                        value={rule.positionConfig?.startingPosition || 'bottomLeft'}
                        label="Starting Position"
                        onChange={(e) => onUpdateField({
                            positionConfig: {
                                ...rule.positionConfig,
                                startingPosition: e.target.value as any
                            }
                        })}
                    >
                        <MenuItem value="topLeft">Top Left</MenuItem>
                        <MenuItem value="topRight">Top Right</MenuItem>
                        <MenuItem value="bottomLeft">Bottom Left</MenuItem>
                        <MenuItem value="bottomRight">Bottom Right</MenuItem>
                    </Select>
                </FormControl>
                <Stack direction="row" spacing={1}>
                    <TextInput
                        type="number"
                        label="Offset X"
                        value={String(rule.positionConfig?.point?.left ?? 0)}
                        onChange={(value) => {
                            const left = Number(value);
                            const currentPoint = rule.positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
                            onUpdateField({
                                positionConfig: {
                                    ...rule.positionConfig,
                                    point: {
                                        ...currentPoint,
                                        left
                                    }
                                }
                            });
                        }}
                        inputProps={{ step: 1 }}
                        sx={{ flex: 1 }}
                    />
                    <TextInput
                        type="number"
                        label="Offset Y"
                        value={String(rule.positionConfig?.point?.top ?? 0)}
                        onChange={(value) => {
                            const top = Number(value);
                            const currentPoint = rule.positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
                            onUpdateField({
                                positionConfig: {
                                    ...rule.positionConfig,
                                    point: {
                                        ...currentPoint,
                                        top
                                    }
                                }
                            });
                        }}
                        inputProps={{ step: 1 }}
                        sx={{ flex: 1 }}
                    />
                    <TextInput
                        type="number"
                        label="Width"
                        value={String(Math.abs((rule.positionConfig?.point?.width ?? 0)))}
                        onChange={(value) => {
                            const width = Number(value);
                            const currentPoint = rule.positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
                            onUpdateField({
                                positionConfig: {
                                    ...rule.positionConfig,
                                    point: {
                                        ...currentPoint,
                                        width
                                    }
                                }
                            });
                        }}
                        inputProps={{ step: 1, min: 0 }}
                        sx={{ flex: 1 }}
                    />
                    <TextInput
                        type="number"
                        label="Height"
                        value={String(Math.abs((rule.positionConfig?.point?.height ?? 0)))}
                        onChange={(value) => {
                            const height = Number(value);
                            const currentPoint = rule.positionConfig?.point || { top: 0, left: 0, width: 0, height: 0 };
                            onUpdateField({
                                positionConfig: {
                                    ...rule.positionConfig,
                                    point: {
                                        ...currentPoint,
                                        height
                                    }
                                }
                            });
                        }}
                        inputProps={{ step: 1, min: 0 }}
                        sx={{ flex: 1 }}
                    />
                </Stack>
            </Box>

            {/* Parser Configuration */}
            <Box sx={{ mt: 2 }}>
                <SubsectionLabel>Regex Patterns</SubsectionLabel>
                <RegexPatterns
                    ref={regexPatternsRef}
                    patterns={rule.parserConfig?.patterns || []}
                    onAdd={(pattern) => {
                        const patterns = [...(rule.parserConfig?.patterns || []), {
                            regex: typeof pattern === 'string' ? pattern : pattern.regex,
                            label: typeof pattern === 'string' ? undefined : pattern.label,
                            priority: (rule.parserConfig?.patterns?.length || 0) + 1
                        }];
                        onUpdateField({
                            parserConfig: {
                                ...rule.parserConfig,
                                patterns
                            }
                        });
                    }}
                    onUpdate={(index, pattern) => {
                        const patterns = [...(rule.parserConfig?.patterns || [])];
                        const existing = patterns[index];
                        if (!existing) return;

                        const newRegex = typeof pattern === 'string' ? pattern : pattern.regex;
                        let newLabel: string | undefined;

                        if (typeof pattern === 'string') {
                            // If user typed a change and existing had a label, remove it when regex actually changes
                            if (existing.label && newRegex !== existing.regex) {
                                newLabel = undefined;
                            } else {
                                newLabel = existing.label; // keep if unchanged
                            }
                        } else {
                            // Chose a preset while editing -> adopt its label
                            newLabel = pattern.label;
                        }

                        patterns[index] = { ...existing, regex: newRegex, label: newLabel };
                        onUpdateField({
                            parserConfig: {
                                ...rule.parserConfig,
                                patterns
                            }
                        });
                    }}
                    onDelete={(index: number) => {
                        const patterns = rule.parserConfig?.patterns?.filter((_, i: number) => i !== index) || [];
                        const reordered = patterns.map((p, idx) => ({ ...p, priority: idx + 1 }));
                        onUpdateField({
                            parserConfig: {
                                ...rule.parserConfig,
                                patterns: reordered
                            }
                        });
                    }}
                    onDragStart={(index: number) => setDraggedPatternIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
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
                                patterns: reordered
                            }
                        });
                        setDraggedPatternIndex(null);
                    }}
                    isDragged={(index: number) => draggedPatternIndex === index}
                />
            </Box>
        </Box>
    );
});

AnchorConfig.displayName = 'AnchorConfig';