'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Stack, 
    Typography
} from '@mui/material';
import { Divider } from '@mui/material';
import { RulesActionBar } from './rules/RulesActionBar';
import { LayoutMapInfo } from './rules/LayoutMapInfo';
import { FieldRulesSection } from './rules/FieldRulesSection';
import { RerunExtractionDialog } from './dialogs/RerunExtractionDialog';
import { BASIC_INFO_FIELDS } from '../config/formFields';
import { Field, AnchorRule, RegexMatchRule, AbsoluteRule, RuleType } from '../types/extractionRules';
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

const DEFAULT_BOUNDING_BOX = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
};

const isAnchorRule = (rule: FieldRule): rule is AnchorRule => rule.ruleType === 'anchor';

function Rules({ vendorId, onRerunExtraction }: RulesProps) {
    const { layoutMap, loading, saveLayoutMap } = useLayoutMap(vendorId);
    const [fieldRules, setFieldRules] = useState<Record<string, FieldRule[]>>({});
    const [draggedRuleIndex, setDraggedRuleIndex] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showRerunDialog, setShowRerunDialog] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

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
                            aliases: rule.anchorConfig?.aliases || [],
                            searchZone: rule.anchorConfig?.searchZone || DEFAULT_SEARCH_ZONE,
                            instance: rule.anchorConfig?.instance || 1,
                            matchMode: rule.anchorConfig?.matchMode || 'exact',
                            ignoreCase: rule.anchorConfig?.ignoreCase ?? true,
                            normalizeWhitespace: rule.anchorConfig?.normalizeWhitespace ?? true
                        },
                        positionConfig: {
                            type: rule.positionConfig?.type || 'relative',
                            boundingBox: rule.positionConfig?.boundingBox || DEFAULT_BOUNDING_BOX,
                            direction: rule.positionConfig?.direction
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

        const updatedFields: Field[] = Object.entries(fieldRules).map(([fieldId, rules]) => ({
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
            if (vendorId && onRerunExtraction) {
                setShowRerunDialog(true);
            }
        } catch (error) {
            console.error('Failed to save layout map:', error);
        }
        setHasUnsavedChanges(false);
        setEditingRuleId(null);
    };

    if (!vendorId) {
        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Typography color="text.secondary">No document selected</Typography>
                <Typography variant="caption" color="text.secondary">Please select a document to view and edit its rules</Typography>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Typography>Loading rules for {vendorId}...</Typography>
            </Box>
        );
    }

    if (!layoutMap) {
        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Typography color="text.secondary">No layout map found for {vendorId}</Typography>
                <Typography variant="caption" color="text.secondary">Create a layout map file for this vendor to enable rule editing</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 2,
            backgroundColor: 'background.paper',
        }}>
            <Box sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
            }}>
                {layoutMap && <LayoutMapInfo layoutMap={layoutMap} />}
            
                <Stack spacing={2}>
                    {BASIC_INFO_FIELDS.map((field, fieldIndex) => {
                        const extractionFieldId = getExtractionFieldId(field.id);
                        return (
                            <React.Fragment key={field.id}>
                                <FieldRulesSection
                                    fieldLabel={field.label}
                                    extractionFieldId={extractionFieldId}
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
                hasUnsavedChanges={hasUnsavedChanges}
                onRerunExtraction={onRerunExtraction ? handleRerunClick : undefined}
                onSave={handleSave}
            />

            {/* Rerun Extraction Confirmation Dialog */}
            <RerunExtractionDialog
                open={showRerunDialog}
                hasUnsavedChanges={hasUnsavedChanges}
                onConfirm={async () => { 
                    if (hasUnsavedChanges) { 
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
