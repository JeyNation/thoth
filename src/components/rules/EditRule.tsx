import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Paper, Stack, Chip, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { EditRuleProps } from '../../types/rulesComponents';
import { AnchorConfig, AnchorConfigRef } from './AnchorConfig';
import { AnchorRule, RegexMatchRule, AbsoluteRule } from '../../types/extractionRules';
import { IconButton } from '../common/IconButton';

export interface EditRuleRef {
    applyPendingChanges: () => void;
    getPendingChanges: () => { pendingAnchor?: string; pendingPattern?: string };
}

export const EditRule = forwardRef<EditRuleRef, EditRuleProps>(({
    rule,
    index,
    onDone,
    onUpdateField
}, ref) => {
    const isAnchorRule = rule.ruleType === 'anchor';
    const anchorRule = isAnchorRule ? rule as AnchorRule : undefined;
    
    const [anchorInputValue, setAnchorInputValue] = useState('');
    const [editingAnchorIndex, setEditingAnchorIndex] = useState<number | null>(null);
    const [pendingDone, setPendingDone] = useState(false);
    
    // Ref for AnchorConfig to access pending regex patterns
    const anchorConfigRef = useRef<AnchorConfigRef>(null);

    // Expose method to apply pending changes
    useImperativeHandle(ref, () => ({
        applyPendingChanges: () => {
            console.log('EditRule.applyPendingChanges called, anchorInputValue:', anchorInputValue);
            
            // Apply pending anchor text
            const pendingAnchor = anchorInputValue.trim();
            if (pendingAnchor && isAnchorRule && anchorRule) {
                console.log('Adding pending anchor text:', pendingAnchor);
                const aliases = [...(anchorRule.anchorConfig?.aliases || []), pendingAnchor];
                onUpdateField({
                    anchorConfig: {
                        ...anchorRule.anchorConfig,
                        aliases
                    }
                });
                setAnchorInputValue(''); // Clear the input after applying
            }
            
            // Apply pending regex patterns
            console.log('Calling anchorConfigRef.current?.applyPendingChanges()');
            anchorConfigRef.current?.applyPendingChanges();
        },
        getPendingChanges: () => {
            const pendingAnchor = anchorInputValue.trim();
            const anchorChanges = anchorConfigRef.current?.getPendingChanges() || {};
            return {
                ...(pendingAnchor ? { pendingAnchor } : {}),
                ...(anchorChanges.pendingPattern ? { pendingPattern: anchorChanges.pendingPattern } : {})
            };
        }
    }), [anchorInputValue, isAnchorRule, anchorRule, onUpdateField]);

    // Handle auto-adding pending anchor text before closing
    useEffect(() => {
        if (pendingDone) {
            onDone();
            setPendingDone(false);
        }
    }, [anchorRule?.anchorConfig?.aliases, pendingDone, onDone]);

    const handleDone = () => {
        console.log('EditRule.handleDone called - applying all pending changes');
        
        // Apply all pending changes first
        const pendingAnchor = anchorInputValue.trim();
        let hasPendingAnchor = false;
        
        if (pendingAnchor && isAnchorRule && anchorRule) {
            console.log('Adding pending anchor text in handleDone:', pendingAnchor);
            // Add the pending anchor text
            const aliases = [...(anchorRule.anchorConfig?.aliases || []), pendingAnchor];
            onUpdateField({
                anchorConfig: {
                    ...anchorRule.anchorConfig,
                    aliases
                }
            });
            setAnchorInputValue(''); // Clear the input after applying
            hasPendingAnchor = true;
        }
        
        // Apply pending regex patterns
        console.log('Applying pending regex patterns in handleDone');
        anchorConfigRef.current?.applyPendingChanges();
        
        if (hasPendingAnchor) {
            // Set flag to call onDone after the anchor update
            setPendingDone(true);
        } else {
            // No pending anchor text, call onDone immediately
            onDone();
        }
    };

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
                        onClick={handleDone}
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

                {isAnchorRule && anchorRule && (
                    <>
                        <Divider />
                        <AnchorConfig
                            ref={anchorConfigRef}
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
            </Stack>
        </Paper>
    );
});

EditRule.displayName = 'EditRule';