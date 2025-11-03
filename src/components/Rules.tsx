'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stack, Button, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, TextField, Switch, FormControlLabel, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { BASIC_INFO_FIELDS, EXTRACTION_FIELD_MAPPING } from '../config/formFields';
import type { LayoutMap } from '../types/extractionRules';
import { getTextFieldSxFor } from '../styles/fieldStyles';

interface RegexPattern {
    regex: string;
    priority: number;
}

interface FieldRule {
    id: string;
    ruleType: '' | 'anchor' | 'regex' | 'absolute';
    // Anchor-specific fields
    anchors?: string[];
    matchMode?: string;
    searchZoneTop?: string;
    searchZoneLeft?: string;
    searchZoneRight?: string;
    searchZoneBottom?: string;
    ignoreCase?: boolean;
    normalizeWhitespace?: boolean;
    direction?: string;
    offsetX?: string;
    offsetY?: string;
    width?: string;
    height?: string;
    regexPatterns?: RegexPattern[];
}

interface RulesProps {
    vendorId?: string;
    onRerunExtraction?: () => void;
}

const Rules: React.FC<RulesProps> = ({ vendorId, onRerunExtraction }) => {
    const [layoutMap, setLayoutMap] = useState<LayoutMap | null>(null);
    const [loading, setLoading] = useState(true);
    const [fieldRules, setFieldRules] = useState<Record<string, FieldRule[]>>({});
    const [anchorInputs, setAnchorInputs] = useState<Record<string, string>>({});
    const [editingAnchor, setEditingAnchor] = useState<{ ruleId: string; index: number } | null>(null);
    const [patternInputs, setPatternInputs] = useState<Record<string, string>>({});
    const [draggedPatternIndex, setDraggedPatternIndex] = useState<number | null>(null);
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
        if (vendorId) {
            loadLayoutMap(vendorId);
        }
    }, [vendorId]);

    useEffect(() => {
        if (!layoutMap) return;

        console.log('Loading rules from layout map:', layoutMap);

        // Convert layout map rules to FieldRule format
        const convertedRules: Record<string, FieldRule[]> = {};
        
        for (const field of layoutMap.fields) {
            console.log('Processing field:', field.id, 'with rules:', field.rules);
            
            convertedRules[field.id] = field.rules.map(rule => {
                console.log('Converting rule:', rule);
                
                const fieldRule: FieldRule = {
                    id: rule.id,
                    ruleType: rule.ruleType === 'regex_match' ? 'regex' : rule.ruleType as any,
                };

                // Convert anchor rule
                if (rule.ruleType === 'anchor') {
                    const anchorRule = rule as any; // Type assertion for anchor rule
                    fieldRule.anchors = anchorRule.anchorConfig?.aliases || [];
                    fieldRule.matchMode = anchorRule.anchorConfig?.matchMode || '';
                    fieldRule.searchZoneTop = String(anchorRule.anchorConfig?.searchZone?.top ?? '0');
                    fieldRule.searchZoneLeft = String(anchorRule.anchorConfig?.searchZone?.left ?? '0');
                    fieldRule.searchZoneRight = String(anchorRule.anchorConfig?.searchZone?.right ?? '1');
                    fieldRule.searchZoneBottom = String(anchorRule.anchorConfig?.searchZone?.bottom ?? '1');
                    fieldRule.ignoreCase = anchorRule.anchorConfig?.ignoreCase ?? false;
                    fieldRule.normalizeWhitespace = anchorRule.anchorConfig?.normalizeWhitespace ?? false;
                    fieldRule.direction = anchorRule.positionConfig?.direction || '';
                    fieldRule.offsetX = String(anchorRule.positionConfig?.boundingBox?.left ?? '');
                    fieldRule.offsetY = String(anchorRule.positionConfig?.boundingBox?.top ?? '');
                    fieldRule.width = String(anchorRule.positionConfig?.boundingBox?.right ?? '');
                    fieldRule.height = String(anchorRule.positionConfig?.boundingBox?.bottom ?? '');
                    fieldRule.regexPatterns = anchorRule.parserConfig?.patterns || [];
                    
                    console.log('Converted anchor rule:', fieldRule);
                }

                return fieldRule;
            });
        }

        console.log('Final converted rules:', convertedRules);
        setFieldRules(convertedRules);
    }, [layoutMap]);

    const loadLayoutMap = async (vendorId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/data/layout_maps/${vendorId}_rules.json`);
            if (response.ok) {
                const data = await response.json();
                setLayoutMap(data);
            }
        } catch (error) {
            console.error('Failed to load layout map:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = (fieldId: string) => {
        const newRule: FieldRule = {
            id: `${fieldId}_rule_${Date.now()}`,
            ruleType: '',
            anchors: [],
            matchMode: '',
            searchZoneTop: '0',
            searchZoneLeft: '0',
            searchZoneRight: '1',
            searchZoneBottom: '1',
            ignoreCase: false,
            normalizeWhitespace: false,
            direction: '',
            offsetX: '',
            offsetY: '',
            width: '',
            height: '',
            regexPatterns: [],
        };
        setFieldRules(prev => ({
            ...prev,
            [fieldId]: [...(prev[fieldId] || []), newRule],
        }));
        setHasUnsavedChanges(true);
    };

    const handleDeleteRule = (fieldId: string, ruleId: string) => {
        setFieldRules(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] || []).filter(rule => rule.id !== ruleId),
        }));
        setHasUnsavedChanges(true);
    };

    const handleRuleTypeChange = (fieldId: string, ruleId: string, ruleType: FieldRule['ruleType']) => {
        setFieldRules(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] || []).map(rule => 
                rule.id === ruleId ? { ...rule, ruleType } : rule
            ),
        }));
        setHasUnsavedChanges(true);
    };

    const updateRuleField = (fieldId: string, ruleId: string, updates: Partial<FieldRule>) => {
        setFieldRules(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] || []).map(rule =>
                rule.id === ruleId ? { ...rule, ...updates } : rule
            ),
        }));
        setHasUnsavedChanges(true);
    };

    const handleAddAnchor = (ruleId: string) => {
        const anchorText = anchorInputs[ruleId]?.trim();
        if (!anchorText) return;

        setFieldRules(prev => {
            const newRules = { ...prev };
            for (const fieldId in newRules) {
                newRules[fieldId] = newRules[fieldId].map(rule => {
                    if (rule.id === ruleId) {
                        return {
                            ...rule,
                            anchors: [...(rule.anchors || []), anchorText],
                        };
                    }
                    return rule;
                });
            }
            return newRules;
        });
        setAnchorInputs(prev => ({ ...prev, [ruleId]: '' }));
        setHasUnsavedChanges(true);
    };

    const handleAnchorInputChange = (ruleId: string, value: string) => {
        setAnchorInputs(prev => ({ ...prev, [ruleId]: value }));
        setHasUnsavedChanges(true);
    };

    const handleDeleteAnchor = (ruleId: string, index: number) => {
        // If we're deleting the anchor that's currently being edited, cancel edit mode
        if (editingAnchor?.ruleId === ruleId && editingAnchor.index === index) {
            setEditingAnchor(null);
            setAnchorInputs(prev => ({ ...prev, [ruleId]: '' }));
        }
        
        setFieldRules(prev => {
            const newRules = { ...prev };
            for (const fieldId in newRules) {
                newRules[fieldId] = newRules[fieldId].map(rule => {
                    if (rule.id === ruleId) {
                        return {
                            ...rule,
                            anchors: (rule.anchors || []).filter((_, i) => i !== index),
                        };
                    }
                    return rule;
                });
            }
            return newRules;
        });
        setHasUnsavedChanges(true);
    };

    const handleEditAnchor = (ruleId: string, index: number) => {
        const rule = Object.values(fieldRules)
            .flat()
            .find(r => r.id === ruleId);
        if (rule?.anchors?.[index]) {
            setAnchorInputs(prev => ({ ...prev, [ruleId]: rule.anchors![index] }));
            setEditingAnchor({ ruleId, index });
        }
    };

    const handleUpdateAnchor = (ruleId: string) => {
        if (!editingAnchor || editingAnchor.ruleId !== ruleId) return;
        
        const anchorText = anchorInputs[ruleId]?.trim();
        if (!anchorText) return;

        setFieldRules(prev => {
            const newRules = { ...prev };
            for (const fieldId in newRules) {
                newRules[fieldId] = newRules[fieldId].map(rule => {
                    if (rule.id === ruleId) {
                        const newAnchors = [...(rule.anchors || [])];
                        newAnchors[editingAnchor.index] = anchorText;
                        return { ...rule, anchors: newAnchors };
                    }
                    return rule;
                });
            }
            return newRules;
        });
        setAnchorInputs(prev => ({ ...prev, [ruleId]: '' }));
        setEditingAnchor(null);
        setHasUnsavedChanges(true);
    };

    const handleCancelEdit = (ruleId: string) => {
        setAnchorInputs(prev => ({ ...prev, [ruleId]: '' }));
        setEditingAnchor(null);
    };

    const handleAddPattern = (ruleId: string) => {
        const patternText = patternInputs[ruleId]?.trim();
        
        if (!patternText) return;

        setFieldRules(prev => {
            const newRules = { ...prev };
            for (const fieldId in newRules) {
                newRules[fieldId] = newRules[fieldId].map(rule => {
                    if (rule.id === ruleId) {
                        const currentPatterns = rule.regexPatterns || [];
                        const nextPriority = currentPatterns.length + 1;
                        
                        return {
                            ...rule,
                            regexPatterns: [...currentPatterns, { regex: patternText, priority: nextPriority }],
                        };
                    }
                    return rule;
                });
            }
            return newRules;
        });
        setPatternInputs(prev => ({ ...prev, [ruleId]: '' }));
        setHasUnsavedChanges(true);
    };

    const applyPendingAnchorToRules = (
        rules: Record<string, FieldRule[]>,
        ruleId: string | null
    ): { rules: Record<string, FieldRule[]>; changed: boolean } => {
        if (!ruleId) {
            return { rules, changed: false };
        }

        const pendingText = anchorInputs[ruleId]?.trim();
        if (!pendingText) {
            return { rules, changed: false };
        }

        for (const [fieldId, ruleList] of Object.entries(rules)) {
            const ruleIndex = ruleList.findIndex(rule => rule.id === ruleId);
            if (ruleIndex === -1) continue;

            const targetRule = ruleList[ruleIndex];
            const anchors = [...(targetRule.anchors || [])];

            if (editingAnchor?.ruleId === ruleId) {
                const replaceIndex = Math.min(editingAnchor.index, Math.max(anchors.length - 1, 0));
                if (anchors.length === 0) {
                    anchors.push(pendingText);
                } else {
                    anchors[replaceIndex] = pendingText;
                }
            } else {
                anchors.push(pendingText);
            }

            const updatedRule: FieldRule = {
                ...targetRule,
                anchors,
            };

            const updatedRulesForField = [...ruleList];
            updatedRulesForField[ruleIndex] = updatedRule;

            return {
                rules: {
                    ...rules,
                    [fieldId]: updatedRulesForField,
                },
                changed: true,
            };
        }

        return { rules, changed: false };
    };

    const finalizePendingAnchor = (
        ruleId: string | null
    ): { rules: Record<string, FieldRule[]>; changed: boolean } => {
        const { rules: updatedRules, changed } = applyPendingAnchorToRules(fieldRules, ruleId);

        if (changed && ruleId) {
            setFieldRules(updatedRules);
            setAnchorInputs(prev => ({ ...prev, [ruleId]: '' }));
            if (editingAnchor?.ruleId === ruleId) {
                setEditingAnchor(null);
            }
            setHasUnsavedChanges(true);
            return { rules: updatedRules, changed: true };
        }

        return { rules: fieldRules, changed: false };
    };

    const handleDeletePattern = (ruleId: string, index: number) => {
        setFieldRules(prev => {
            const newRules = { ...prev };
            for (const fieldId in newRules) {
                newRules[fieldId] = newRules[fieldId].map(rule => {
                    if (rule.id === ruleId) {
                        return {
                            ...rule,
                            regexPatterns: (rule.regexPatterns || []).filter((_, i) => i !== index),
                        };
                    }
                    return rule;
                });
            }
            return newRules;
        });
        setHasUnsavedChanges(true);
    };

    const handlePatternDragStart = (index: number) => {
        setDraggedPatternIndex(index);
    };

    const handlePatternDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handlePatternDrop = (ruleId: string, dropIndex: number) => {
        if (draggedPatternIndex === null || draggedPatternIndex === dropIndex) {
            setDraggedPatternIndex(null);
            return;
        }

        setFieldRules(prev => {
            const newRules = { ...prev };
            for (const fieldId in newRules) {
                newRules[fieldId] = newRules[fieldId].map(rule => {
                    if (rule.id === ruleId) {
                        const patterns = [...(rule.regexPatterns || [])];
                        const [draggedPattern] = patterns.splice(draggedPatternIndex, 1);
                        patterns.splice(dropIndex, 0, draggedPattern);
                        
                        // Update priorities to match new order
                        const updatedPatterns = patterns.map((pattern, idx) => ({
                            ...pattern,
                            priority: idx + 1
                        }));
                        
                        return {
                            ...rule,
                            regexPatterns: updatedPatterns,
                        };
                    }
                    return rule;
                });
            }
            return newRules;
        });
        
        setDraggedPatternIndex(null);
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

        setFieldRules(prev => {
            const rules = [...(prev[fieldId] || [])];
            const [draggedRule] = rules.splice(draggedRuleIndex, 1);
            rules.splice(dropIndex, 0, draggedRule);
            
            return {
                ...prev,
                [fieldId]: rules
            };
        });
        
        setDraggedRuleIndex(null);
        setHasUnsavedChanges(true);
    };

    const describeSearchZone = (rule: FieldRule): string => {
        const values = [rule.searchZoneTop, rule.searchZoneLeft, rule.searchZoneRight, rule.searchZoneBottom];
        const hasCustomZone = values.some((value) => value !== undefined && value !== '');

        const parseNormalized = (value: string | undefined, fallback: number) => {
            if (value === undefined || value === '') {
                return fallback;
            }
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) {
                return fallback;
            }
            return Math.min(Math.max(parsed, 0), 1);
        };

        let top = parseNormalized(rule.searchZoneTop, 0);
        let left = parseNormalized(rule.searchZoneLeft, 0);
        let right = parseNormalized(rule.searchZoneRight, 1);
        let bottom = parseNormalized(rule.searchZoneBottom, 1);

        if (right < left) [left, right] = [right, left];
        if (bottom < top) [top, bottom] = [bottom, top];

        const width = right - left;
        const height = bottom - top;

        const coversFullWidth = left <= 0.05 && right >= 0.95;
        const coversFullHeight = top <= 0.05 && bottom >= 0.95;
        const effectivelyWholePage = width >= 0.95 && height >= 0.95;

        if (!hasCustomZone || coversFullWidth && coversFullHeight || effectivelyWholePage) {
            return 'Search anchor from the whole page.';
        }

        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        const horizontalZone = coversFullWidth ? 'full' : centerX < 0.33 ? 'left' : centerX > 0.67 ? 'right' : 'center';
        const verticalZone = coversFullHeight ? 'full' : centerY < 0.33 ? 'top' : centerY > 0.67 ? 'bottom' : 'middle';

        const toPercentRange = (start: number, end: number) => `${Math.round(start * 100)}%-${Math.round(end * 100)}%`;
        const horizontalRange = toPercentRange(left, right);
        const verticalRange = toPercentRange(top, bottom);

        let regionPhrase: string;

        if (coversFullWidth && !coversFullHeight) {
            const verticalLabel = verticalZone === 'middle' ? 'the middle' : `the ${verticalZone}`;
            regionPhrase = `${verticalLabel} of the page`;
        } else if (!coversFullWidth && coversFullHeight) {
            if (horizontalZone === 'center') {
                regionPhrase = 'the center of the page';
            } else {
                regionPhrase = `the ${horizontalZone} side of the page`;
            }
        } else {
            const verticalLabel = verticalZone === 'middle' ? 'center' : verticalZone;
            const horizontalLabel = horizontalZone === 'center' ? 'center' : horizontalZone;

            if (verticalLabel === 'center' && horizontalLabel === 'center') {
                regionPhrase = 'the center of the page';
            } else if (verticalLabel === 'center') {
                regionPhrase = `the center-${horizontalLabel} of the page`;
            } else if (horizontalLabel === 'center') {
                regionPhrase = `the ${verticalLabel} center of the page`;
            } else {
                regionPhrase = `the ${verticalLabel} ${horizontalLabel} of the page`;
            }
        }

        return `Search anchor from ${regionPhrase} (~x ${horizontalRange}, ~y ${verticalRange}).`;
    };

    const generatePseudoRule = (rule: FieldRule): string[] => {
        if (rule.ruleType === 'anchor') {
            const lines: string[] = [];
            
            // Anchors with match mode
            if (rule.anchors && rule.anchors.length > 0) {
                const anchorList = rule.anchors.map(a => `"${a}"`).join(', ');
                const mode = rule.matchMode === 'startsWith' ? 'starting with' :
                             rule.matchMode === 'endsWith' ? 'ending with' :
                             rule.matchMode === 'contains' ? 'containing' :
                             rule.matchMode === 'exact' ? 'exactly matching' : '';
                
                if (mode && rule.anchors.length === 1) {
                    lines.push(`Find anchor text ${mode} ${anchorList}`);
                } else if (mode) {
                    lines.push(`Find anchor text ${mode} any of: ${anchorList}`);
                } else {
                    lines.push(`Find anchor text: ${anchorList}`);
                }
            }
            
            // Search zone description
            lines.push(describeSearchZone(rule));
            
            // Direction
            if (rule.direction) {
                const directionMap: Record<string, string> = {
                    'right': 'from the right side of',
                    'left': 'from the left side of',
                    'top': 'above',
                    'bottom': 'below',
                };
                const dirText = directionMap[rule.direction] || rule.direction;
                lines.push(`Locate text ${dirText} the anchor`);
            }
            
            // Regex patterns
            if (rule.regexPatterns && rule.regexPatterns.length > 0) {
                if (rule.regexPatterns.length === 1) {
                    lines.push(`Parse with regex pattern`);
                } else {
                    lines.push(`Parse with ${rule.regexPatterns.length} regex patterns`);
                }
            }
            
            return lines.length > 0 ? lines : ['No configuration'];
        }
        
        return ['No rule configured'];
    };

    const handleSave = async () => {
        if (!layoutMap) return;

        const { rules: fieldRulesSnapshot } = finalizePendingAnchor(editingRuleId);

        // Convert FieldRule format back to LayoutMap format
        const updatedFields = Object.entries(fieldRulesSnapshot).map(([fieldId, rules]) => ({
            id: fieldId,
            rules: rules.map((rule, index) => {
                const baseRule = {
                    id: rule.id,
                    priority: index + 1,
                    ruleType: rule.ruleType === 'regex' ? 'regex_match' : rule.ruleType,
                };

                if (rule.ruleType === 'anchor') {
                    return {
                        ...baseRule,
                        ruleType: 'anchor' as const,
                        anchorConfig: {
                            aliases: rule.anchors || [],
                            searchZone: {
                                top: parseFloat(rule.searchZoneTop || '0'),
                                left: parseFloat(rule.searchZoneLeft || '0'),
                                right: parseFloat(rule.searchZoneRight || '1'),
                                bottom: parseFloat(rule.searchZoneBottom || '1'),
                            },
                            instance: 1,
                            matchMode: rule.matchMode,
                            ignoreCase: rule.ignoreCase,
                            normalizeWhitespace: rule.normalizeWhitespace,
                        },
                        positionConfig: {
                            type: 'relative' as const,
                            direction: rule.direction,
                            boundingBox: {
                                top: parseFloat(rule.offsetY || '0'),
                                left: parseFloat(rule.offsetX || '0'),
                                right: parseFloat(rule.width || '0'),
                                bottom: parseFloat(rule.height || '0'),
                            },
                        },
                        parserConfig: {
                            patterns: rule.regexPatterns || [],
                            fallbackToFullText: true,
                        },
                    };
                }

                return baseRule;
            }),
        }));

        const updatedLayoutMap = {
            ...layoutMap,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
        };

        console.log('Saving layout map:', updatedLayoutMap);
        
        try {
            const response = await fetch('/api/layout-maps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedLayoutMap),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Failed to save layout map:', error);
                alert(`Failed to save: ${error.message || 'Unknown error'}`);
                return;
            }

            const result = await response.json();
            console.log('Layout map saved successfully:', result);
            
            // Update local state with the saved layout map
            setLayoutMap(result.layoutMap);
            setHasUnsavedChanges(false);
            
            // Close edit mode
            setEditingRuleId(null);
            
        } catch (error) {
            console.error('Error saving layout map:', error);
            alert(`Error saving layout map: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
                {layoutMap && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">ID</Typography>
                                <Typography variant="body2">{layoutMap.id}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Name</Typography>
                                <Typography variant="body2">{layoutMap.name}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Vendor ID</Typography>
                                <Typography variant="body2">{layoutMap.vendorId}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Version</Typography>
                                <Typography variant="body2">{layoutMap.version}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                )}
            
                <Stack spacing={2}>
                    {BASIC_INFO_FIELDS.map((field, fieldIndex) => {
                        // Get the extraction field ID (e.g., 'document-number' for 'documentNumber')
                        const extractionFieldId = Object.entries(EXTRACTION_FIELD_MAPPING).find(
                            ([_, formFieldId]) => formFieldId === field.id
                        )?.[0] || field.id;
                        
                        return (
                            <React.Fragment key={field.id}>
                                <Box>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary" 
                                            sx={{ 
                                                display: 'block',
                                                textTransform: 'uppercase',
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                letterSpacing: '0.08em'
                                            }}
                                        >
                                            {field.label}
                                        </Typography>
                                        <Tooltip title="Add rule">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => {
                                                    if (editingRuleId) {
                                                        finalizePendingAnchor(editingRuleId);
                                                    }
                                                    handleAddRule(extractionFieldId);
                                                }}
                                                sx={{
                                                    bgcolor: 'transparent',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    },
                                                    transition: 'background-color 0.2s'
                                                }}
                                                aria-label={`Add rule for ${field.label}`}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                    
                                    {/* Display rules - mix of view and edit mode */}
                                    <Stack spacing={1.5} sx={{ mb: 1.5 }}>
                                        {(fieldRules[extractionFieldId] || []).length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                                                No rules configured
                                            </Typography>
                                        ) : (
                                            (fieldRules[extractionFieldId] || []).map((rule, index) => {
                                                const isEditingThisRule = editingRuleId === rule.id;
                                                
                                                return (
                                                <React.Fragment key={rule.id}>
                                            {/* View Mode - Human Readable Pseudo Rule */}
                                            {!isEditingThisRule && (
                                                <Paper 
                                                    variant="outlined" 
                                                    draggable
                                                    onDragStart={() => handleRuleDragStart(index)}
                                                    onDragOver={handleRuleDragOver}
                                                    onDrop={() => handleRuleDrop(extractionFieldId, index)}
                                                    sx={{ 
                                                        p: 1.5, 
                                                        bgcolor: 'action.hover',
                                                        cursor: 'grab',
                                                        '&:active': {
                                                            cursor: 'grabbing',
                                                        },
                                                        opacity: draggedRuleIndex === index ? 0.5 : 1,
                                                        transition: 'opacity 0.2s',
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                                                        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1 }}>
                                                            <DragIndicatorIcon 
                                                                fontSize="small" 
                                                                sx={{ color: 'text.secondary', cursor: 'grab', mt: 0.25 }}
                                                            />
                                                            <Box sx={{ flex: 1 }}>
                                                                {generatePseudoRule(rule).map((line, lineIndex) => (
                                                                    <Typography 
                                                                        key={lineIndex} 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            mb: lineIndex < generatePseudoRule(rule).length - 1 ? 0.5 : 0,
                                                                            '&::before': lineIndex > 0 ? {
                                                                                content: '"→ "',
                                                                                color: 'primary.main',
                                                                                fontWeight: 600,
                                                                                mr: 0.5
                                                                            } : undefined
                                                                        }}
                                                                    >
                                                                        {line}
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        </Stack>
                                                        <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mt: -0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    if (editingRuleId && editingRuleId !== rule.id) {
                                                                        finalizePendingAnchor(editingRuleId);
                                                                    }
                                                                    setEditingRuleId(rule.id);
                                                                }}
                                                                sx={{ color: 'text.secondary' }}
                                                                aria-label="Edit rule"
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteRule(extractionFieldId, rule.id)}
                                                                sx={{ color: 'error.main' }}
                                                                aria-label="Delete rule"
                                                            >
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>
                                                </Paper>
                                            )}
                                            
                                            {/* Edit Mode - Full Rule Configuration */}
                                            {isEditingThisRule && (
                                                <Paper 
                                                    variant="outlined" 
                                                    sx={{ p: 2 }}
                                                >
                                                    <Stack spacing={2}>
                                                    {/* Rule Header */}
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
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => {
                                                                finalizePendingAnchor(rule.id);
                                                                setEditingRuleId(null);
                                                            }}
                                                            startIcon={<CheckIcon fontSize="small" />}
                                                        >
                                                            Done
                                                        </Button>
                                                    </Stack>

                                                    {/* Rule Type Selector */}
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Rule Type</InputLabel>
                                                        <Select
                                                            value={rule.ruleType}
                                                            label="Rule Type"
                                                            onChange={(e) => handleRuleTypeChange(extractionFieldId, rule.id, e.target.value as FieldRule['ruleType'])}
                                                        >
                                                            <MenuItem value=""><em>Select rule type</em></MenuItem>
                                                            <MenuItem value="anchor">Anchor</MenuItem>
                                                            <MenuItem value="regex">Regex Match</MenuItem>
                                                            <MenuItem value="absolute">Absolute Position</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    {/* Anchor Configuration */}
                                                    {rule.ruleType === 'anchor' && (
                                                        <>
                                                            <Divider />
                                                            
                                                            {/* Anchor Text */}
                                                            <Box>
                                                                <Typography 
                                                                    variant="caption" 
                                                                    color="text.secondary"
                                                                    sx={{ 
                                                                        display: 'block',
                                                                        textTransform: 'uppercase',
                                                                        mb: 0.5,
                                                                        fontSize: '0.6875rem',
                                                                        fontWeight: 600,
                                                                        letterSpacing: '0.08em'
                                                                    }}
                                                                >
                                                                    Anchor Text
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" sx={{ mb: 1 }}>
                                                                    {(rule.anchors || []).map((anchor, anchorIndex) => (
                                                                        <Chip
                                                                            key={anchorIndex}
                                                                            label={anchor}
                                                                            size="small"
                                                                            onDelete={() => handleDeleteAnchor(rule.id, anchorIndex)}
                                                                            onClick={() => handleEditAnchor(rule.id, anchorIndex)}
                                                                            deleteIcon={<DeleteOutlineIcon fontSize="small" />}
                                                                            sx={{ mb: 0.5 }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                                <Stack direction="row" spacing={1}>
                                                                    <TextField
                                                                        size="small"
                                                                        fullWidth
                                                                        value={anchorInputs[rule.id] || ''}
                                                                        onChange={(e) => handleAnchorInputChange(rule.id, e.target.value)}
                                                                        onKeyPress={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                if (editingAnchor?.ruleId === rule.id) {
                                                                                    handleUpdateAnchor(rule.id);
                                                                                } else {
                                                                                    handleAddAnchor(rule.id);
                                                                                }
                                                                            }
                                                                        }}
                                                                        sx={getTextFieldSxFor(false)}
                                                                    />
                                                                    {editingAnchor?.ruleId === rule.id ? (
                                                                <>
                                                                    <Button
                                                                        variant="contained"
                                                                        size="small"
                                                                        onClick={() => handleUpdateAnchor(rule.id)}
                                                                        startIcon={<CheckIcon fontSize="small" />}
                                                                        sx={{ minWidth: 100 }}
                                                                    >
                                                                        Update
                                                                    </Button>
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        onClick={() => handleCancelEdit(rule.id)}
                                                                        startIcon={<CloseIcon fontSize="small" />}
                                                                        sx={{ minWidth: 100 }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => handleAddAnchor(rule.id)}
                                                                    startIcon={<AddIcon fontSize="small" />}
                                                                    sx={{ minWidth: 80 }}
                                                                >
                                                                    Add
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </Box>

                                                    {/* Match Mode */}
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Match Mode</InputLabel>
                                                        <Select
                                                            value={rule.matchMode || ''}
                                                            label="Match Mode"
                                                            onChange={(e) => updateRuleField(extractionFieldId, rule.id, { matchMode: e.target.value })}
                                                        >
                                                            <MenuItem value=""><em>Select match mode</em></MenuItem>
                                                            <MenuItem value="exact">Exact Match</MenuItem>
                                                            <MenuItem value="startsWith">Starts With</MenuItem>
                                                            <MenuItem value="contains">Contains</MenuItem>
                                                            <MenuItem value="endsWith">Ends With</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    {/* Search Zone */}
                                                    <Box>
                                                        <Typography 
                                                            variant="caption" 
                                                            color="text.secondary"
                                                            sx={{ 
                                                                display: 'block',
                                                                textTransform: 'uppercase',
                                                                mb: 0.5,
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.08em'
                                                            }}
                                                        >
                                                            Search Zone
                                                        </Typography>
                                                        <Stack direction="row" spacing={1}>
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                label="Top"
                                                                value={rule.searchZoneTop || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { searchZoneTop: e.target.value })}
                                                                inputProps={{ min: 0, max: 1, step: 0.01 }}
                                                                placeholder="0-1"
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                label="Left"
                                                                value={rule.searchZoneLeft || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { searchZoneLeft: e.target.value })}
                                                                inputProps={{ min: 0, max: 1, step: 0.01 }}
                                                                placeholder="0-1"
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                label="Right"
                                                                value={rule.searchZoneRight || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { searchZoneRight: e.target.value })}
                                                                inputProps={{ min: 0, max: 1, step: 0.01 }}
                                                                placeholder="0-1"
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                label="Bottom"
                                                                value={rule.searchZoneBottom || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { searchZoneBottom: e.target.value })}
                                                                inputProps={{ min: 0, max: 1, step: 0.01 }}
                                                                placeholder="0-1"
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                        </Stack>
                                                    </Box>

                                                    {/* Ignore Case & Normalize Whitespace */}
                                                    <Stack direction="row" spacing={2}>
                                                        <FormControlLabel
                                                            control={
                                                                <Switch
                                                                    checked={rule.ignoreCase || false}
                                                                    onChange={(e) => updateRuleField(extractionFieldId, rule.id, { ignoreCase: e.target.checked })}
                                                                />
                                                            }
                                                            label="Ignore Case"
                                                        />
                                                        <FormControlLabel
                                                            control={
                                                                <Switch
                                                                    checked={rule.normalizeWhitespace || false}
                                                                    onChange={(e) => updateRuleField(extractionFieldId, rule.id, { normalizeWhitespace: e.target.checked })}
                                                                />
                                                            }
                                                            label="Normalize Whitespace"
                                                        />
                                                    </Stack>

                                                    {/* Position Configuration */}
                                                    <Box>
                                                        <Typography 
                                                            variant="caption" 
                                                            color="text.secondary"
                                                            sx={{ 
                                                                display: 'block',
                                                                textTransform: 'uppercase',
                                                                mb: 0.5,
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.08em'
                                                            }}
                                                        >
                                                            Position
                                                        </Typography>
                                                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                                            <InputLabel>Direction</InputLabel>
                                                            <Select
                                                                value={rule.direction || ''}
                                                                label="Direction"
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { direction: e.target.value })}
                                                            >
                                                                <MenuItem value=""><em>Select direction</em></MenuItem>
                                                                <MenuItem value="right">Right</MenuItem>
                                                                <MenuItem value="left">Left</MenuItem>
                                                                <MenuItem value="below">Below</MenuItem>
                                                                <MenuItem value="above">Above</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        <Stack direction="row" spacing={1}>
                                                            <TextField
                                                                size="small"
                                                                label="Offset X"
                                                                value={rule.offsetX || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { offsetX: e.target.value })}
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                label="Offset Y"
                                                                value={rule.offsetY || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { offsetY: e.target.value })}
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                label="Width"
                                                                value={rule.width || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { width: e.target.value })}
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                label="Height"
                                                                value={rule.height || ''}
                                                                onChange={(e) => updateRuleField(extractionFieldId, rule.id, { height: e.target.value })}
                                                                sx={{ flex: 1, ...getTextFieldSxFor(false) }}
                                                            />
                                                        </Stack>
                                                    </Box>

                                                    {/* Parser Configuration */}
                                                    <Box>
                                                        <Typography 
                                                            variant="caption" 
                                                            color="text.secondary"
                                                            sx={{ 
                                                                display: 'block',
                                                                textTransform: 'uppercase',
                                                                mb: 0.5,
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.08em'
                                                            }}
                                                        >
                                                            Regex Patterns
                                                        </Typography>
                                                        
                                                        {/* Display existing patterns */}
                                                        <Stack spacing={0.5} sx={{ mb: 1 }}>
                                                            {(rule.regexPatterns || []).map((pattern, patternIndex) => (
                                                                <Paper 
                                                                    key={patternIndex} 
                                                                    variant="outlined" 
                                                                    draggable
                                                                    onDragStart={() => handlePatternDragStart(patternIndex)}
                                                                    onDragOver={handlePatternDragOver}
                                                                    onDrop={() => handlePatternDrop(rule.id, patternIndex)}
                                                                    sx={{ 
                                                                        p: 1, 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        gap: 1,
                                                                        cursor: 'grab',
                                                                        '&:active': {
                                                                            cursor: 'grabbing',
                                                                        },
                                                                        opacity: draggedPatternIndex === patternIndex ? 0.5 : 1,
                                                                        transition: 'opacity 0.2s',
                                                                    }}
                                                                >
                                                                    <DragIndicatorIcon 
                                                                        fontSize="small" 
                                                                        sx={{ color: 'text.secondary', cursor: 'grab' }}
                                                                    />
                                                                    <Chip 
                                                                        label={`Priority ${pattern.priority}`} 
                                                                        size="small" 
                                                                        color="secondary"
                                                                        variant="outlined"
                                                                        sx={{ minWidth: 80 }}
                                                                    />
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            flex: 1, 
                                                                            fontFamily: 'monospace',
                                                                            fontSize: '0.875rem'
                                                                        }}
                                                                    >
                                                                        {pattern.regex}
                                                                    </Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDeletePattern(rule.id, patternIndex)}
                                                                        sx={{ color: 'error.main' }}
                                                                    >
                                                                        <DeleteOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Paper>
                                                            ))}
                                                        </Stack>

                                                        {/* Add new pattern */}
                                                        <Stack spacing={1}>
                                                            <Stack direction="row" spacing={1}>
                                                                <TextField
                                                                    size="small"
                                                                    label="Regex Pattern"
                                                                    fullWidth
                                                                    value={patternInputs[rule.id] || ''}
                                                                    onChange={(e) => setPatternInputs(prev => ({ ...prev, [rule.id]: e.target.value }))}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleAddPattern(rule.id);
                                                                        }
                                                                    }}
                                                                    placeholder="e.g. ^([A-Z0-9-]+)"
                                                                    sx={getTextFieldSxFor(false)}
                                                                />
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => handleAddPattern(rule.id)}
                                                                    startIcon={<AddIcon fontSize="small" />}
                                                                    sx={{ minWidth: 80 }}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                </>
                                            )}
                                        </Stack>

                                    </Paper>
                                )}
                            </React.Fragment>
                        );
                    })
                )}
            </Stack>
                                </Box>
                                {fieldIndex < BASIC_INFO_FIELDS.length - 1 && (
                                    <Divider sx={{ my: 2 }} />
                                )}
                            </React.Fragment>
                    );
                    })}
                </Stack>
            </Box>

            {/* Sticky Button Bar */}
            <Box sx={{
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
            }}>
                <Button
                    variant="outlined"
                    onClick={handleRerunClick}
                    disabled={!onRerunExtraction}
                    startIcon={<PlayArrowIcon fontSize="small" />}
                    sx={{ minWidth: 150, borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
                >
                    Rerun Extraction
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                    sx={{ minWidth: 150, borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
                >
                    Save Rules
                </Button>
            </Box>

            {/* Rerun Extraction Confirmation Dialog */}
            <Dialog
                open={showRerunDialog}
                onClose={handleRerunCancel}
                fullWidth
                maxWidth="sm"
                aria-labelledby="rerun-dialog-title"
                aria-describedby="rerun-dialog-description"
            >
                <DialogTitle id="rerun-dialog-title" sx={{ pb: 1 }}>
                    Rerun Extraction?
                </DialogTitle>
                <DialogContent dividers sx={{ py: 2 }}>
                    <DialogContentText id="rerun-dialog-description">
                        This will clear all currently mapped fields and re-extract data using the current rules. 
                        Any manual edits or mappings will be lost. Are you sure you want to continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button 
                        onClick={handleRerunCancel} 
                        color="inherit" 
                        variant="outlined"
                        sx={{ borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleRerunConfirm} 
                        variant="contained"
                        disableFocusRipple
                        disableRipple
                        sx={{ borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
                    >
                        Rerun Extraction
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Rules;
