import React, { useState } from 'react';
import { Paper, Stack, Chip, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { EditRuleProps } from '../../types/rulesComponents';
import { AnchorConfig } from './AnchorConfig';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
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
                            rule={anchorRule}
                            onUpdateField={(u) => onUpdateField(u)}
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

                {/* Additional anchor configuration moved into AnchorConfig */}
            </Stack>
        </Paper>
    );
};