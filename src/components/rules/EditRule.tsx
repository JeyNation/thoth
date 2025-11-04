import React, { useState } from 'react';
import { Paper, Stack, Chip, FormControl, InputLabel, Select, MenuItem, Box, Divider, FormControlLabel, Switch, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { EditRuleProps } from '../../types/rulesComponents';
import { SearchZone } from './SearchZone';
import { RegexPatterns } from './RegexPatterns';
import { AnchorConfig } from './AnchorConfig';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
import { SubsectionLabel } from '../common/SubsectionLabel';
import { IconButton } from '../common/IconButton';

export const EditRule: React.FC<EditRuleProps> = ({
    rule,
    index,
    onDone,
    onUpdateField
}) => {
    const isAnchorRule = rule.ruleType === 'anchor';
    const anchorRule = isAnchorRule ? rule as AnchorRule : undefined;
    
    const [anchorInputValue, setAnchorInputValue] = useState('');
    const [editingAnchorIndex, setEditingAnchorIndex] = useState<number | null>(null);
    const [draggedPatternIndex, setDraggedPatternIndex] = useState<number | null>(null);

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                            label={`Rule ${index + 1}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                        />
                        <Chip 
                            label={`Priority ${index + 1}`} 
                            size="small" 
                            color="secondary"
                            variant="outlined"
                        />
                    </Stack>
                    <IconButton
                        icon={CheckIcon}
                        tooltip="Done"
                        onClick={onDone}
                        color="primary"
                    />
                </Stack>

                <FormControl fullWidth size="small">
                    <InputLabel>Rule Type</InputLabel>
                    <Select
                        value={rule.ruleType}
                        label="Rule Type"
                        onChange={(e) => onUpdateField({ ruleType: e.target.value as 'anchor' | 'regex_match' | 'absolute' })}
                    >
                        <MenuItem value=""><em>Select rule type</em></MenuItem>
                        <MenuItem value="anchor">Anchor</MenuItem>
                        <MenuItem value="regex_match">Regex Match</MenuItem>
                        <MenuItem value="absolute">Absolute Position</MenuItem>
                    </Select>
                </FormControl>

                {/* Anchor Configuration */}
                {isAnchorRule && anchorRule && (
                    <>
                        <Divider />
                        <AnchorConfig
                            anchors={anchorRule.anchorConfig?.aliases || []}
                            onAdd={(anchor: string) => {
                                if (!anchor.trim()) return;
                                const aliases = [...(anchorRule.anchorConfig?.aliases || []), anchor.trim()];
                                onUpdateField({
                                    anchorConfig: {
                                        ...anchorRule.anchorConfig,
                                        aliases
                                    }
                                });
                                setAnchorInputValue('');
                            }}
                            onDelete={(index: number) => {
                                const aliases = anchorRule.anchorConfig?.aliases?.filter((_: string, i: number) => i !== index) || [];
                                onUpdateField({
                                    anchorConfig: {
                                        ...anchorRule.anchorConfig,
                                        aliases
                                    }
                                });
                            }}
                            onEdit={(index: number) => {
                                const currentAnchor = anchorRule.anchorConfig?.aliases?.[index];
                                if (currentAnchor) {
                                    setAnchorInputValue(currentAnchor);
                                    setEditingAnchorIndex(index);
                                }
                            }}
                            onUpdate={(anchor: string) => {
                                if (!anchor.trim() || editingAnchorIndex === null) return;
                                const aliases = [...(anchorRule.anchorConfig?.aliases || [])];
                                aliases[editingAnchorIndex] = anchor.trim();
                                onUpdateField({
                                    anchorConfig: {
                                        ...anchorRule.anchorConfig,
                                        aliases
                                    }
                                });
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

                {/* Match Mode */}
                {isAnchorRule && anchorRule && (
                    <FormControl fullWidth size="small">
                        <InputLabel>Match Mode</InputLabel>
                        <Select
                            value={anchorRule.anchorConfig?.matchMode || ''}
                            label="Match Mode"
                            onChange={(e) => onUpdateField({
                                anchorConfig: {
                                    ...anchorRule.anchorConfig,
                                    matchMode: e.target.value as 'exact' | 'startsWith' | 'contains' | 'endsWith'
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
                )}

                {/* Search Zone */}
                {isAnchorRule && anchorRule && (
                    <Box>
                        <SubsectionLabel>Search Zone</SubsectionLabel>
                        <SearchZone
                            top={String(anchorRule.anchorConfig?.searchZone?.top ?? 0)}
                            left={String(anchorRule.anchorConfig?.searchZone?.left ?? 0)}
                            right={String(anchorRule.anchorConfig?.searchZone?.right ?? 1)}
                            bottom={String(anchorRule.anchorConfig?.searchZone?.bottom ?? 1)}
                            onChange={(field: string, value: string) => {
                                const fieldMap: Record<string, string> = {
                                    'searchZoneTop': 'top',
                                    'searchZoneLeft': 'left',
                                    'searchZoneRight': 'right',
                                    'searchZoneBottom': 'bottom'
                                };
                                const actualField = fieldMap[field] || field;
                                const numValue = parseFloat(value);
                                
                                onUpdateField({
                                    anchorConfig: {
                                        ...anchorRule.anchorConfig,
                                        searchZone: {
                                            ...anchorRule.anchorConfig?.searchZone,
                                            [actualField]: isNaN(numValue) ? 0 : numValue
                                        }
                                    }
                                });
                            }}
                        />
                    </Box>
                )}

                {isAnchorRule && anchorRule && (
                    <>
                        <Stack direction="row" spacing={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={anchorRule.anchorConfig?.ignoreCase ?? true}
                                        onChange={(e) => onUpdateField({
                                            anchorConfig: {
                                                ...anchorRule.anchorConfig,
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
                                        checked={anchorRule.anchorConfig?.normalizeWhitespace ?? true}
                                        onChange={(e) => onUpdateField({
                                            anchorConfig: {
                                                ...anchorRule.anchorConfig,
                                                normalizeWhitespace: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Normalize Whitespace"
                            />
                        </Stack>

                        {/* Position Configuration */}
                        <Box>
                            <SubsectionLabel>Position</SubsectionLabel>
                            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                <InputLabel>Direction</InputLabel>
                                <Select
                                    value={anchorRule.positionConfig.direction || ''}
                                    label="Direction"
                                    onChange={(e) => onUpdateField({
                                        positionConfig: {
                                            ...anchorRule.positionConfig,
                                            direction: e.target.value as 'top' | 'bottom' | 'left' | 'right'
                                        }
                                    })}
                                >
                                    <MenuItem value=""><em>Select direction</em></MenuItem>
                                    <MenuItem value="right">Right</MenuItem>
                                    <MenuItem value="left">Left</MenuItem>
                                    <MenuItem value="bottom">Below</MenuItem>
                                    <MenuItem value="top">Above</MenuItem>
                                </Select>
                            </FormControl>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Offset X"
                                    value={anchorRule.positionConfig?.boundingBox?.left ?? 0}
                                    onChange={(e) => {
                                        const left = Number(e.target.value);
                                        const currentBoundingBox = anchorRule.positionConfig?.boundingBox || { top: 0, left: 0, right: 0, bottom: 0 };
                                        const currentWidth = currentBoundingBox.right - currentBoundingBox.left;
                                        onUpdateField({
                                            positionConfig: {
                                                ...anchorRule.positionConfig,
                                                boundingBox: {
                                                    ...currentBoundingBox,
                                                    left: left,
                                                    right: left + currentWidth
                                                }
                                            }
                                        });
                                    }}
                                    inputProps={{ step: 1 }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Offset Y"
                                    value={anchorRule.positionConfig?.boundingBox?.top ?? 0}
                                    onChange={(e) => {
                                        const top = Number(e.target.value);
                                        const currentBoundingBox = anchorRule.positionConfig?.boundingBox || { top: 0, left: 0, right: 0, bottom: 0 };
                                        const currentHeight = currentBoundingBox.bottom - currentBoundingBox.top;
                                        onUpdateField({
                                            positionConfig: {
                                                ...anchorRule.positionConfig,
                                                boundingBox: {
                                                    ...currentBoundingBox,
                                                    top: top,
                                                    bottom: top + currentHeight
                                                }
                                            }
                                        });
                                    }}
                                    inputProps={{ step: 1 }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Width"
                                    value={Math.abs((anchorRule.positionConfig?.boundingBox?.right ?? 0) - (anchorRule.positionConfig?.boundingBox?.left ?? 0))}
                                    onChange={(e) => {
                                        const width = Number(e.target.value);
                                        const currentBoundingBox = anchorRule.positionConfig?.boundingBox || { top: 0, left: 0, right: 0, bottom: 0 };
                                        onUpdateField({
                                            positionConfig: {
                                                ...anchorRule.positionConfig,
                                                boundingBox: {
                                                    ...currentBoundingBox,
                                                    right: currentBoundingBox.left + width
                                                }
                                            }
                                        });
                                    }}
                                    inputProps={{ step: 1, min: 0 }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Height"
                                    value={Math.abs((anchorRule.positionConfig?.boundingBox?.bottom ?? 0) - (anchorRule.positionConfig?.boundingBox?.top ?? 0))}
                                    onChange={(e) => {
                                        const height = Number(e.target.value);
                                        const currentBoundingBox = anchorRule.positionConfig?.boundingBox || { top: 0, left: 0, right: 0, bottom: 0 };
                                        onUpdateField({
                                            positionConfig: {
                                                ...anchorRule.positionConfig,
                                                boundingBox: {
                                                    ...currentBoundingBox,
                                                    bottom: currentBoundingBox.top + height
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
                        <Box>
                            <SubsectionLabel>Regex Patterns</SubsectionLabel>
                            <RegexPatterns
                                patterns={anchorRule.parserConfig?.patterns || []}
                                onAdd={(pattern: string) => {
                                    const patterns = [...(anchorRule.parserConfig?.patterns || []), { 
                                        regex: pattern,
                                        priority: (anchorRule.parserConfig?.patterns?.length || 0) + 1
                                    }];
                                    onUpdateField({
                                        parserConfig: {
                                            ...anchorRule.parserConfig,
                                            patterns
                                        }
                                    });
                                }}
                                onDelete={(index: number) => {
                                    const patterns = anchorRule.parserConfig?.patterns?.filter((_, i: number) => i !== index) || [];
                                    // Update priorities after deletion
                                    const reorderedPatterns = patterns.map((p, idx) => ({
                                        ...p,
                                        priority: idx + 1
                                    }));
                                    onUpdateField({
                                        parserConfig: {
                                            ...anchorRule.parserConfig,
                                            patterns: reorderedPatterns
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
                                    
                                    const patterns = [...(anchorRule.parserConfig?.patterns || [])];
                                    const [draggedItem] = patterns.splice(draggedPatternIndex, 1);
                                    patterns.splice(dropIndex, 0, draggedItem);
                                    
                                    // Update priorities after reordering
                                    const reorderedPatterns = patterns.map((p, idx) => ({
                                        ...p,
                                        priority: idx + 1
                                    }));
                                    
                                    onUpdateField({
                                        parserConfig: {
                                            ...anchorRule.parserConfig,
                                            patterns: reorderedPatterns
                                        }
                                    });
                                    
                                    setDraggedPatternIndex(null);
                                }}
                                isDragged={(index: number) => draggedPatternIndex === index}
                            />
                        </Box>
                    </>
                )}
            </Stack>
        </Paper>
    );
};