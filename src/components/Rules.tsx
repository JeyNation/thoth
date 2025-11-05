'use client';

import React, { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { 
    Box, 
    Stack, 
    Typography
} from '@mui/material';
import { Divider } from '@mui/material';
import { RulesActionBar } from './rules/RulesActionBar';
import { FieldRulesSection, FieldRulesListRef } from './rules/FieldRulesSection';
import { RerunExtractionDialog } from './dialogs/RerunExtractionDialog';
import { LoadingIndicator } from './common/LoadingIndicator';
import { EmptyState } from './common/EmptyState';
import { BASIC_INFO_FIELDS } from '../config/formFields';
import { Field, AnchorRule, RegexMatchRule, AbsoluteRule, RuleType, PositionPoint } from '../types/extractionRules';
import { RULES_ROOT_SX, RULES_CONTENT_SX } from '../styles/rulesStyles';
import { useLayoutMap } from '../hooks/useLayoutMap';
import { getExtractionFieldId } from '../utils/formUtils';
import {
    createDefaultAnchorRule,
    addRuleToField,
    deleteRuleFromField,
    changeRuleType,
    updateRule,
    reorderRules
} from '../utils/ruleUtils';

type FieldRule = AnchorRule | RegexMatchRule | AbsoluteRule;

interface RulesProps {
    vendorId?: string;
    onRerunExtraction?: () => void;
}

const DEFAULT_SEARCH_ZONE = {
    top: 0,
    left: 0,
    right: 1,
    bottom: 1
};

const DEFAULT_POSITION_POINT: PositionPoint = {
    top: 0,
    left: 0,
    width: 0,
    height: 0
};

const isAnchorRule = (rule: FieldRule): rule is AnchorRule => rule.ruleType === 'anchor';

function Rules({ vendorId, onRerunExtraction }: RulesProps) {
    const { layoutMap, loading, saveLayoutMap } = useLayoutMap(vendorId);
    const [fieldRules, setFieldRules] = useState<Record<string, FieldRule[]>>({});
    const [draggedRuleIndex, setDraggedRuleIndex] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);

    // Function to check if there are any pending changes in input fields
    const checkForPendingChanges = (): boolean => {
        let hasPendingChanges = false;
        fieldRulesSectionRefs.current.forEach((ref) => {
            const pendingChanges = ref.getAllPendingChanges();
            if (Object.keys(pendingChanges).length > 0) {
                hasPendingChanges = true;
            }
        });
        return hasPendingChanges;
    };

    // Periodically check for pending changes
    useEffect(() => {
        const interval = setInterval(() => {
            const newHasPendingChanges = checkForPendingChanges();
            setHasPendingChanges(newHasPendingChanges);
        }, 300); // Check every 300ms

        return () => clearInterval(interval);
    }, []);

    // Combined check for unsaved changes (both committed changes and pending input)
    const hasAnyUnsavedChanges = hasUnsavedChanges || hasPendingChanges;
    const [showRerunDialog, setShowRerunDialog] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    
    // Refs to access FieldRulesList components
    const fieldRulesSectionRefs = useRef<Map<string, FieldRulesListRef>>(new Map());

    const handleRerunClick = () => {
        if (!onRerunExtraction) return;
        setShowRerunDialog(true);
    };

    const handleRerunConfirm = () => {
        setShowRerunDialog(false);
        if (onRerunExtraction) {
            onRerunExtraction();
        }
    };

    const handleRerunCancel = () => {
        setShowRerunDialog(false);
    };

    useEffect(() => {
        if (!layoutMap) return;
        const convertedRules: Record<string, FieldRule[]> = {};
        
        for (const field of layoutMap.fields) {
            convertedRules[field.id] = field.rules.map(rule => {
                if (isAnchorRule(rule)) {
                        return {
                            ...rule,
                            anchorConfig: {
                                ...rule.anchorConfig,
                                aliases: rule.anchorConfig?.aliases || [],
                                searchZone: rule.anchorConfig?.searchZone || DEFAULT_SEARCH_ZONE,
                                instance: rule.anchorConfig?.instance || 1,
                                instanceFrom: (rule.anchorConfig as any)?.instanceFrom || 'start',
                                matchMode: rule.anchorConfig?.matchMode || 'exact',
                                ignoreCase: rule.anchorConfig?.ignoreCase ?? true,
                                normalizeWhitespace: rule.anchorConfig?.normalizeWhitespace ?? true,
                                pageScope: (rule.anchorConfig as any)?.pageScope || 'first'
                            },
                        positionConfig: {
                            type: rule.positionConfig?.type || 'relative',
                            point: rule.positionConfig?.point || DEFAULT_POSITION_POINT,
                            // Preserve startingPosition if present in stored layout
                            ...(rule.positionConfig && 'startingPosition' in (rule.positionConfig as any)
                                ? { startingPosition: (rule.positionConfig as any).startingPosition }
                                : {})
                        },
                        parserConfig: {
                            patterns: rule.parserConfig?.patterns || [],
                            fallbackToFullText: rule.parserConfig?.fallbackToFullText ?? false
                        }
                    };
                }
                return rule;
            });
        }

        setFieldRules(convertedRules);
        setHasUnsavedChanges(false);
        setEditingRuleId(null);
    }, [layoutMap]);

    const handleAddRule = (fieldId: string) => {
        const newRule = createDefaultAnchorRule(fieldId);
        setFieldRules(prev => addRuleToField(prev, fieldId, newRule));
        setHasUnsavedChanges(true);
    };

    const handleDeleteRule = (fieldId: string, ruleId: string) => {
        setFieldRules(prev => deleteRuleFromField(prev, fieldId, ruleId));
        setHasUnsavedChanges(true);
    };

    const handleRuleTypeChange = (fieldId: string, ruleId: string, newRuleType: RuleType) => {
        setFieldRules(prev => changeRuleType(prev, fieldId, ruleId, newRuleType));
        setHasUnsavedChanges(true);
    };

    const updateRuleField = (fieldId: string, ruleId: string, updates: Partial<AnchorRule | RegexMatchRule | AbsoluteRule>) => {
        setFieldRules(prev => updateRule(prev, fieldId, ruleId, updates));
        setHasUnsavedChanges(true);
    };

    const handleRuleDragStart = (index: number) => {
        setDraggedRuleIndex(index);
    };

    const handleRuleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleRuleDrop = (fieldId: string, dropIndex: number) => {
        if (draggedRuleIndex === null || draggedRuleIndex === dropIndex) {
            setDraggedRuleIndex(null);
            return;
        }

        setFieldRules(prev => reorderRules(prev, fieldId, draggedRuleIndex, dropIndex));
        setDraggedRuleIndex(null);
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        if (!layoutMap) return;

        console.log('Rules.handleSave called - collecting all pending changes');
        console.log('Current fieldRules before applying changes:', fieldRules);
        
        // First, collect all pending changes without applying them via state
        const allPendingChanges: Record<string, Record<string, {
            pendingAnchor?: string;
            pendingAnchorEdit?: { index: number; value: string };
            pendingPattern?: string | { regex: string; label?: string };
            pendingPatternEdit?: { index: number; pattern: string | { regex: string; label?: string } };
        }>> = {};
        fieldRulesSectionRefs.current.forEach((ref, fieldId) => {
            console.log(`Collecting pending changes for field ${fieldId}`);
            const fieldPending = ref.getAllPendingChanges();
            if (Object.keys(fieldPending).length > 0) {
                allPendingChanges[fieldId] = fieldPending;
                console.log(`Found pending changes for field ${fieldId}:`, fieldPending);
            }
        });
        
        console.log('All pending changes collected:', allPendingChanges);
        
        // Create a modified copy of fieldRules with pending changes applied
        let modifiedFieldRules = { ...fieldRules };
        Object.entries(allPendingChanges).forEach(([fieldId, rulePendingChanges]) => {
            Object.entries(rulePendingChanges).forEach(([ruleId, pending]) => {
                const fieldRulesArray = [...(modifiedFieldRules[fieldId] || [])];
                const ruleIndex = fieldRulesArray.findIndex(r => r.id === ruleId);
                
                if (ruleIndex !== -1) {
                    const rule = fieldRulesArray[ruleIndex];
                    if (rule.ruleType === 'anchor') {
                        const anchorRule = rule as any;
                        let updatedRule = { ...anchorRule };
                        
                        // Apply pending anchor add/edit
                        if (pending.pendingAnchorEdit) {
                            const aliases = [...(anchorRule.anchorConfig?.aliases || [])];
                            const { index, value } = pending.pendingAnchorEdit;
                            if (index >= 0 && index < aliases.length) aliases[index] = value;
                            updatedRule = {
                                ...updatedRule,
                                anchorConfig: { ...anchorRule.anchorConfig, aliases }
                            };
                        } else if (pending.pendingAnchor) {
                            const aliases = [...(anchorRule.anchorConfig?.aliases || []), pending.pendingAnchor];
                            updatedRule = {
                                ...updatedRule,
                                anchorConfig: { ...anchorRule.anchorConfig, aliases }
                            };
                        }
                        
                        // Apply pending regex add/edit
                        if (pending.pendingPatternEdit) {
                            const patterns = [...(anchorRule.parserConfig?.patterns || [])];
                            const { index, pattern } = pending.pendingPatternEdit as any;
                            if (index >= 0 && index < patterns.length) {
                                const existing = patterns[index];
                                const newRegex = typeof pattern === 'string' ? pattern : pattern.regex;
                                let newLabel = existing.label;
                                if (typeof pattern === 'string') {
                                    if (existing.label && newRegex !== existing.regex) newLabel = undefined;
                                } else {
                                    newLabel = pattern.label;
                                }
                                patterns[index] = { ...existing, regex: newRegex, label: newLabel };
                                updatedRule = {
                                    ...updatedRule,
                                    parserConfig: { ...anchorRule.parserConfig, patterns }
                                };
                            }
                        } else if (pending.pendingPattern) {
                            const pp: any = pending.pendingPattern;
                            const next = [...(anchorRule.parserConfig?.patterns || [])];
                            if (typeof pp === 'string') {
                                next.push({ regex: pp, priority: next.length + 1 });
                            } else {
                                next.push({ regex: pp.regex, label: pp.label, priority: next.length + 1 });
                            }
                            updatedRule = {
                                ...updatedRule,
                                parserConfig: { ...anchorRule.parserConfig, patterns: next }
                            };
                        }
                        
                        fieldRulesArray[ruleIndex] = updatedRule;
                    }
                }
                
                modifiedFieldRules[fieldId] = fieldRulesArray;
            });
        });
        
        console.log('Modified fieldRules with pending changes applied:', modifiedFieldRules);
        
        // Now clear the pending inputs by calling applyPendingChanges (which clears the inputs)
        fieldRulesSectionRefs.current.forEach((ref, fieldId) => {
            console.log(`Clearing pending changes for field ${fieldId}`);
            ref.applyAllPendingChanges();
        });

        const updatedFields: Field[] = Object.entries(modifiedFieldRules).map(([fieldId, rules]) => ({
            id: fieldId,
            rules: rules.map((rule, index) => {
                const baseRule = {
                    id: rule.id,
                    priority: index + 1,
                    ruleType: rule.ruleType
                };

                switch (rule.ruleType) {
                    case 'anchor':
                        return {
                            ...baseRule,
                            anchorConfig: rule.anchorConfig,
                            positionConfig: rule.positionConfig,
                            parserConfig: rule.parserConfig
                        } as AnchorRule;
                    case 'regex_match':
                        return baseRule as RegexMatchRule;
                    case 'absolute':
                        return baseRule as AbsoluteRule;
                    default:
                        return rule;
                }
            })
        }));

        const updatedLayoutMap = {
            ...layoutMap,
            fields: updatedFields
        };

        try {
            await saveLayoutMap(updatedLayoutMap);
            setHasUnsavedChanges(false);
            setHasPendingChanges(false);
        } catch (error) {
            console.error('Failed to save layout map:', error);
        }
        setHasUnsavedChanges(false);
        setHasPendingChanges(false);
        setEditingRuleId(null);
    };

    if (!vendorId) {
        return (
            <EmptyState 
                message="No document selected" 
                description="Please select a document to view and edit its rules" 
            />
        );
    }

    if (loading) {
        return <LoadingIndicator message={`Loading rules for ${vendorId}...`} sx={{ height: '100%', p: 2 }} />;
    }

    if (!layoutMap) {
        return (
            <EmptyState 
                message={`No layout map found for ${vendorId}`}
                description="Create a layout map file for this vendor to enable rule editing"
            />
        );
    }

    return (
        <Box sx={RULES_ROOT_SX}>
            <Box sx={RULES_CONTENT_SX}>
                <Stack spacing={2}>
                    {BASIC_INFO_FIELDS.map((field, fieldIndex) => {
                        const extractionFieldId = getExtractionFieldId(field.id);
                        return (
                            <React.Fragment key={field.id}>
                                <FieldRulesSection
                                    ref={(fieldRulesSectionRef) => {
                                        if (fieldRulesSectionRef) {
                                            fieldRulesSectionRefs.current.set(extractionFieldId, fieldRulesSectionRef);
                                        } else {
                                            fieldRulesSectionRefs.current.delete(extractionFieldId);
                                        }
                                    }}
                                    fieldLabel={field.label}
                                    rules={fieldRules[extractionFieldId] || []}
                                    editingRuleId={editingRuleId}
                                    draggedRuleIndex={draggedRuleIndex}
                                    onAddRule={() => handleAddRule(extractionFieldId)}
                                    onEditRule={setEditingRuleId}
                                    onDeleteRule={(ruleId) => handleDeleteRule(extractionFieldId, ruleId)}
                                    onDoneEditing={() => setEditingRuleId(null)}
                                    onUpdateField={(ruleId, updates) => updateRuleField(extractionFieldId, ruleId, updates)}
                                    onRuleDragStart={handleRuleDragStart}
                                    onRuleDragOver={handleRuleDragOver}
                                    onRuleDrop={(index) => handleRuleDrop(extractionFieldId, index)}
                                />
                                {fieldIndex < BASIC_INFO_FIELDS.length - 1 && (
                                    <Divider sx={{ my: 2 }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </Stack>
            </Box>

            {/* Sticky Button Bar */}
            <RulesActionBar
                hasUnsavedChanges={hasAnyUnsavedChanges}
                onRerunExtraction={onRerunExtraction ? handleRerunClick : undefined}
                onSave={handleSave}
            />

            {/* Rerun Extraction Confirmation Dialog */}
            <RerunExtractionDialog
                open={showRerunDialog}
                hasUnsavedChanges={hasAnyUnsavedChanges}
                onConfirm={async () => { 
                    if (hasAnyUnsavedChanges) { 
                        await handleSave(); 
                    } 
                    handleRerunConfirm(); 
                }}
                onCancel={handleRerunCancel}
            />
        </Box>
    );
};

export { Rules };
