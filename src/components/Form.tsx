'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { PurchaseOrder, LineItem } from '../types/PurchaseOrder';
import { makeLineItemField } from '../types/fieldIds';
import { addBlankLineItem as poAddBlankLineItem, removeLineItem, computeNextLineNumber, ensureLineNumberExists, insertBlankLineItem } from '../utils/purchaseOrderMutations';
import { remapFieldSourcesForInsertion } from '../utils/mappingRemap';
import type { MultiFieldPair } from '../types/mapping';
import { useMapping } from '../context/MappingContext';
import ColumnMappingDialog from './dialogs/ColumnMappingDialog';
import RowMappingDialog from './dialogs/RowMappingDialog';
import { LINE_ITEM_COLUMNS, humanizeColumnKey, type LineItemColumnKey } from '../types/lineItemColumns';
import { predictRow, sanitizeText, commitMapping, predictColumn, commitColumnAssignments } from '../utils/formUtils';
import { DROP_ACTIVE_BG, DROP_ACTIVE_BORDER, DROP_ACTIVE_INSET, DROP_BORDER_RADIUS_PX } from '../styles/dropHighlight';
import ClearAdornment from './form/ClearAdornment';
import ColumnDropHeader from './form/ColumnDropHeader';
import BasicFieldInput from './form/BasicFieldInput';
import LineItemField from './form/LineItemField';
import LineItemCard from './form/LineItemCard';
import useFlashHighlight from '../hooks/useFlashHighlight';

type BasicFieldKey = Exclude<keyof PurchaseOrder, 'lineItems'>;

const BASIC_FIELD_CONFIGS: BasicFieldConfig[] = [
    {
        id: 'documentNumber',
        label: 'Document Number',
        kind: 'text',
    },
    {
        id: 'customerNumber',
        label: 'Customer Number',
        kind: 'text',
    },
    {
        id: 'shipToAddress',
        label: 'Ship To Address',
        kind: 'textarea',
        multiline: true,
        rows: 3,
    },
];

const LINE_ITEM_FIELD_LABEL: Record<'sku' | 'description' | 'quantity' | 'unitPrice', string> = {
    sku: 'SKU',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
};

interface BasicFieldConfig {
    id: BasicFieldKey;
    label: string;
    kind: 'text' | 'textarea';
    multiline?: boolean;
    rows?: number;
}

interface FormProps {
    onUpdate: (purchaseOrder: PurchaseOrder) => void;
    onFieldFocus?: (fieldId: string | null) => void;
    clearPersistentFocus?: () => void;
    focusedBoundingBoxId?: string | null;
}

interface MultiFieldDragData { 
    pairs: MultiFieldPair[]; 
    boundingBoxIds: string[]; 
}

interface MultiFieldDragPayload {
    isMultiField?: boolean;
    pairs?: MultiFieldPair[];
    boundingBoxIds?: string[];
}

const Form: React.FC<FormProps> = ({ onUpdate, onFieldFocus, clearPersistentFocus, focusedBoundingBoxId }) => {
    const [columnMappingDialog, setColumnMappingDialog] = useState<null | { lineNumber: number; drag: MultiFieldDragData; proposed: Record<string, LineItemColumnKey | ''> }>(null);
    const [rowMappingDialog, setRowMappingDialog] = useState<null | { column: LineItemColumnKey; drag: MultiFieldDragData; proposedRows: Record<string, number | null> }>(null);
    const [addButtonDragActive, setAddButtonDragActive] = useState(false);
    const [activeRowDropLine, setActiveRowDropLine] = useState<number | null>(null);
    const [activeColumnDrop, setActiveColumnDrop] = useState<{ lineNumber: number; field: LineItemColumnKey } | null>(null);
    const [activeBasicDrop, setActiveBasicDrop] = useState<BasicFieldKey | null>(null);
    const [focusedFieldIdLocal, setFocusedFieldIdLocal] = useState<string | null>(null);

    const initializedRef = useRef(false);

    const { fieldSources, reverseIndex, purchaseOrder, applyTransaction } = useMapping();
    const { flashField, getStage } = useFlashHighlight({ strongMs: 300, fadeMs: 1000 });

    const linkedFieldIdSet = useMemo(() => {
        const s = new Set<string>();
        Object.entries(fieldSources).forEach(([fid, entry]) => { 
            if (entry.ids && entry.ids.length) s.add(fid);
        });
        return s;
    }, [fieldSources]);

    const focusedLinkedFieldIds = useMemo(() => {
        if (!focusedBoundingBoxId) return new Set<string>();
        if (reverseIndex && reverseIndex[focusedBoundingBoxId]) {
            return new Set(reverseIndex[focusedBoundingBoxId]);
        }
        const s = new Set<string>();
        Object.entries(fieldSources).forEach(([fid, entry]) => { 
            if (entry.ids.includes(focusedBoundingBoxId)) s.add(fid); 
        });
        return s;
    }, [focusedBoundingBoxId, fieldSources, reverseIndex]);

    const isFieldHighlighted = (fieldId: string) => {
        const hasOwnLinks = linkedFieldIdSet.has(fieldId);
        const isFormFocused = focusedFieldIdLocal === fieldId;
        const linkedViaFocusedBox = focusedLinkedFieldIds.has(fieldId);
        return (hasOwnLinks && isFormFocused) || linkedViaFocusedBox;
    };

    const getTextFieldSx = (fieldId: string) => {
        const highlight = isFieldHighlighted(fieldId);
        const stage = getStage(fieldId);
        
        const root: Record<string, any> = {
            borderRadius: 1.5,
            backgroundColor: highlight ? 'rgba(76,175,80,0.15)' : 'background.paper',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
            '& fieldset': {
                borderWidth: highlight ? 2 : 1,
                borderColor: highlight ? '#4caf50' : 'divider',
            },
            '&:hover fieldset': {
                borderColor: highlight ? '#2e7d32' : 'primary.main',
            },
            '&.Mui-focused fieldset': {
                borderColor: highlight ? '#2e7d32' : 'primary.main',
                boxShadow: highlight ? '0 0 0 2px rgba(46,125,50,0.25)' : '0 0 0 2px rgba(25,118,210,0.18)',
            },
        };
        
        if (stage === 'strong') {
            root.transition = 'background-color 1s ease, box-shadow 1s ease, border-color 1s ease';
            root.backgroundColor = 'rgba(255,235,59,0.55)';
            root.boxShadow = '0 0 0 1px rgba(255,193,7,0.8)';
            root['& fieldset'] = {
                ...(root['& fieldset'] || {}),
                borderColor: 'rgba(255,193,7,0.85)',
                borderWidth: 1,
            };
        } 
        else if (stage === 'fade') {
            root.transition = 'background-color 1s ease, box-shadow 1s ease, border-color 1s ease';
            root['& fieldset'] = {
                ...(root['& fieldset'] || {}),
                transition: 'border-color 1s ease',
            };
        }
        
        return {
            '& .MuiOutlinedInput-root': root,
            '& input[type="number"]': {
                appearance: 'textfield',
                MozAppearance: 'textfield',
            },
            '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
            },
        };
    };

    useEffect(() => {
        if (!initializedRef.current && purchaseOrder.lineItems.length === 0) {
            initializedRef.current = true;
            const firstLine: LineItem = { lineNumber: 1, sku: '', description: '', quantity: 0, unitPrice: 0 };
            onUpdate({
                ...purchaseOrder,
                lineItems: [firstLine]
            });
        }
    }, [purchaseOrder, onUpdate]);

    const handleBasicInfoChange = (field: string, value: string | number, kind: string = 'text', opts?: { explicitClear?: boolean }) => {
        let nextVal: any = value;
        if (opts?.explicitClear) {
            nextVal = (kind === 'integer' || kind === 'decimal') ? 0 : '';
        }
        const updated = { ...purchaseOrder, [field]: nextVal } as PurchaseOrder;
        const mappingUpdates: { fieldId: string; sourceIds: string[] }[] = [];
        const stringy = typeof nextVal === 'string' ? nextVal.trim() : null;
        const shouldClearSources = (opts?.explicitClear && (nextVal === '' || nextVal === 0)) || (typeof nextVal === 'string' && stringy === '');
        if (shouldClearSources) {
            mappingUpdates.push({ fieldId: field, sourceIds: [] });
        }
        applyTransaction({ mappingUpdates, purchaseOrder: updated });
    };

    const handleLineItemChange = (lineNumber: number, field: string, value: string | number, kind: string = 'text', opts?: { explicitClear?: boolean }) => {
        let nextVal: any = value;
        if (opts?.explicitClear) {
            nextVal = (kind === 'integer' || kind === 'decimal') ? 0 : '';
        }
        const updatedItems = purchaseOrder.lineItems.map(item => item.lineNumber === lineNumber ? { ...item, [field]: nextVal } : item);
        const updated = { ...purchaseOrder, lineItems: updatedItems } as PurchaseOrder;
        const fid = makeLineItemField(lineNumber, field as any);
        const mappingUpdates: { fieldId: string; sourceIds: string[] }[] = [];
        const stringy = typeof nextVal === 'string' ? nextVal.trim() : null;
        const shouldClearSources = (opts?.explicitClear && (nextVal === '' || nextVal === 0)) || (typeof nextVal === 'string' && stringy === '');
        if (shouldClearSources) {
            mappingUpdates.push({ fieldId: fid, sourceIds: [] });
        }
        applyTransaction({ mappingUpdates, purchaseOrder: updated });
    };

    const handleFormClick = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('input, textarea, button, .form-group')) {
            onFieldFocus && onFieldFocus(null);
            clearPersistentFocus && clearPersistentFocus();
        }
    };

    const addBlankLineItem = () => {
        const updated = poAddBlankLineItem(purchaseOrder);
        if (updated !== purchaseOrder) {
            applyTransaction({ mappingUpdates: [], purchaseOrder: updated });
        }
    };

    const getNextLineNumber = () => computeNextLineNumber(purchaseOrder);

    const ensureSpecificLineExists = (lineNumber: number) => {
        const updated = ensureLineNumberExists(purchaseOrder, lineNumber);
        if (updated !== purchaseOrder) applyTransaction({ mappingUpdates: [], purchaseOrder: updated });
    };

    const handleAddLineItemDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        let dragData: MultiFieldDragPayload | null = null;
        try { dragData = JSON.parse(data); } catch { return; }
        if (!dragData || !Array.isArray(dragData.pairs) || dragData.pairs.length === 0) return;

        const newLineNumber = getNextLineNumber();
        ensureSpecificLineExists(newLineNumber);
        openRowDropDialog(newLineNumber, dragData);
    };

    const handleRemoveLineItem = (lineNumber: number) => {
        const { purchaseOrder: next, removedFieldIds, remappedFieldIds } = removeLineItem(purchaseOrder, lineNumber);
        if (next === purchaseOrder) return;
        const clears = removedFieldIds.map(fid => ({ fieldId: fid, sourceIds: [] as string[] }));
        const { updates: remapUpdates } = remapFieldSourcesForInsertion(fieldSources, remappedFieldIds);
        const mappingUpdates = [...clears, ...remapUpdates];
        applyTransaction({ mappingUpdates, purchaseOrder: next });
    };

    const handleInsertLineRelative = (lineNumber: number, options?: { before?: boolean }) => {
        const anchor = options?.before ? Math.max(lineNumber - 1, 0) : lineNumber;
        const { purchaseOrder: nextPO, remappedFieldIds, newLineNumber } = insertBlankLineItem(purchaseOrder, anchor);
        if (nextPO === purchaseOrder) return;
        const { updates } = remapFieldSourcesForInsertion(fieldSources, remappedFieldIds);
        applyTransaction({ mappingUpdates: updates, purchaseOrder: nextPO });
        requestAnimationFrame(() => {
            const fid = makeLineItemField(newLineNumber, 'sku');
            const el = document.getElementById(fid);
            if (el) (el as HTMLInputElement).focus();
        });
    };

    const clearBasicField = (field: string, kind: string) => {
        handleBasicInfoChange(field, '', kind, { explicitClear: true });
        onFieldFocus && onFieldFocus(null);
    };

    const clearLineItemField = (lineNumber: number, field: string, kind: string) => {
        handleLineItemChange(lineNumber, field, '', kind, { explicitClear: true });
        onFieldFocus && onFieldFocus(null);
    };

    const handleBasicDrop = (e: React.DragEvent, targetField: string, fieldKind: 'text' | 'textarea') => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) { 
            console.warn('No drag data found'); return; 
        }
        let dragData: any;
        try { 
            dragData = JSON.parse(data); 
        } 
        catch {
            return;
        }

        const additive = e.ctrlKey || e.shiftKey;
        const droppedIds: string[] = Array.isArray(dragData.boundingBoxIds) ? dragData.boundingBoxIds : [];
        const currentIds: string[] = fieldSources?.[targetField]?.ids || [];
        const nextIds = additive ? Array.from(new Set([...(currentIds || []), ...droppedIds])) : droppedIds;
        const mappingUpdates = droppedIds.length ? [{ fieldId: targetField, sourceIds: nextIds }] : [];
        const processedText = sanitizeText(dragData.text, fieldKind);
        const currentValue: string = (purchaseOrder[targetField as keyof PurchaseOrder] as any as string) || '';
        const nextValue = additive
            ? (currentValue ? (fieldKind === 'textarea' ? `${currentValue}\n${processedText}` : `${currentValue} ${processedText}`) : processedText)
            : processedText;
        const updated = { ...purchaseOrder, [targetField]: nextValue };
        applyTransaction({ mappingUpdates, purchaseOrder: updated }); // no onUpdate duplication
        flashField(targetField);
    };

    const handleLineItemDrop = (
        e: React.DragEvent,
        lineNumber: number,
        targetField: string,
        fieldKind: 'text' | 'textarea' | 'integer' | 'decimal'
    ) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) { console.warn('No drag data found'); return; }
        let dragData: any; try { dragData = JSON.parse(data); } catch { return; }
        const additive = e.ctrlKey || e.shiftKey;
        const fid = makeLineItemField(lineNumber, targetField as any);
        const droppedIds: string[] = Array.isArray(dragData.boundingBoxIds) ? dragData.boundingBoxIds : [];
        const currentIds: string[] = fieldSources?.[fid]?.ids || [];
        const nextIds = additive ? Array.from(new Set([...(currentIds || []), ...droppedIds])) : droppedIds;
        const mappingUpdates = droppedIds.length ? [{ fieldId: fid, sourceIds: nextIds }] : [];
        const processedText = sanitizeText(dragData.text, fieldKind);
        const updatedItems = purchaseOrder.lineItems.map(item => {
            if (item.lineNumber !== lineNumber) return item;
            
            if (fieldKind === 'text' || fieldKind === 'textarea') {
                const currentVal = (item as any)[targetField] as string;
                const nextVal = additive
                    ? (currentVal ? (fieldKind === 'textarea' ? `${currentVal}\n${processedText}` : `${currentVal} ${processedText}`) : processedText)
                    : processedText;
                return { ...item, [targetField]: nextVal } as any;
            }
            return { ...item, [targetField]: processedText } as any;
        });
        const updated = { ...purchaseOrder, lineItems: updatedItems };
        applyTransaction({ mappingUpdates, purchaseOrder: updated }); // single history entry
        flashField(fid);
    };

    const handleColumnDrop = (e: React.DragEvent, column: LineItemColumnKey) => {
        e.preventDefault();

        const data = e.dataTransfer.getData('application/json');
        if (data)
        {
            const dragData: MultiFieldDragPayload = JSON.parse(data);
            if (Array.isArray(dragData.pairs) && dragData.pairs.length > 0) {
                openColumnDropDialog(column, dragData);
                return;
            }
        }
        console.warn('No drag data found');
    };

    const handleRowDrop = (e: React.DragEvent, lineNumber: number) => {
        e.preventDefault();

        const data = e.dataTransfer.getData('application/json');
        if (data)
        {
            const dragData: MultiFieldDragPayload = JSON.parse(data);
            if (Array.isArray(dragData.pairs) && dragData.pairs.length > 0) {
                openRowDropDialog(lineNumber, dragData);
                return;
            }
        }
        console.warn('No drag data found');
    };

    const openRowDropDialog = (lineNumber: number, dragData: MultiFieldDragPayload) => {
        const pairs: MultiFieldPair[] = dragData.pairs || [];
        if (!pairs.length) return;

        const sourcesWithGeometry = fieldSources ? Object.entries(fieldSources).map(([fieldId, entry]) => ({
            fieldId,
            ids: entry.ids,
            boxes: entry.boxes
        })) : [];

        const result = predictRow(lineNumber, pairs, sourcesWithGeometry);

        const proposed: Record<string, LineItemColumnKey | ''> = {} as Record<string, LineItemColumnKey | ''>;
        let ambiguous = false;

        result.pairOverlaps.forEach(por => {
            const insideCols = (Object.entries(por.perColumn) as [LineItemColumnKey, { midpointInside: boolean } ][])
                .filter(([, v]) => v.midpointInside)
                .map(([col]) => col);
            if (insideCols.length === 1) {
                proposed[por.pair.fieldId] = insideCols[0];
            } else {
                    if (insideCols.length > 1) {
                        const counts = insideCols.map(col => ({ col, count: result.midpointHits[col] || 0 }))
                            .sort((a,b) => b.count - a.count);
                        if (counts.length && (counts.length === 1 || counts[1].count === 0 || counts[0].count >= counts[1].count * 9)) {
                            proposed[por.pair.fieldId] = counts[0].col;
                            return;
                        }
                    }
                    ambiguous = true;
                    proposed[por.pair.fieldId] = '';
            }
        });

        if (!ambiguous) {
            let poAfter = purchaseOrder;
            const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
            commitMapping({
                lineNumber,
                pairs,
                proposed,
                purchaseOrder,
                onUpdate: (po) => { poAfter = po; },
                onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids })
            });
            if (poAfter !== purchaseOrder || tempUpdates.length) {
                applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
                tempUpdates.forEach(u => flashField(u.fieldId));
            }
            return;
        }

        setColumnMappingDialog({
            lineNumber,
            drag: { 
                pairs, 
                boundingBoxIds: dragData.boundingBoxIds || [] 
            },
            proposed
        });
    };

    const openColumnDropDialog = (column: LineItemColumnKey, dragData: MultiFieldDragPayload) => {
        const pairs: MultiFieldPair[] = dragData.pairs || [];
        if (!pairs.length) return;
        const sourcesWithGeometry = fieldSources ? Object.entries(fieldSources).map(([fieldId, entry]) => ({ fieldId, ids: entry.ids, boxes: entry.boxes })) : [];
        const result = predictColumn(0, pairs, sourcesWithGeometry);

        const proposedRows: Record<string, number | null> = {};
        let ambiguous = false;

        result.rowPairOverlaps.forEach(rpo => {
            const insideRows = Object.entries(rpo.perRow)
                .filter(([, v]) => v.midpointInside)
                .map(([rowStr]) => parseInt(rowStr,10));
            if (insideRows.length === 1) {
                proposedRows[rpo.pair.fieldId] = insideRows[0];
                return;
            }
            if (insideRows.length > 1) {
                const counts = insideRows
                    .map(rn => ({ rn, count: result.midpointHits[rn] || 0 }))
                    .sort((a,b)=> b.count - a.count);

                if (counts.length && (counts.length === 1 || counts[1].count === 0 || counts[0].count >= counts[1].count * 9)) {
                    proposedRows[rpo.pair.fieldId] = counts[0].rn;
                    return;
                }
            }
            if (!insideRows.length && rpo.bestRow != null && (rpo.bestOverlapRatio ?? 0) >= 0.5) {
                proposedRows[rpo.pair.fieldId] = rpo.bestRow;
                return;
            }
            ambiguous = true;
            proposedRows[rpo.pair.fieldId] = null;
        });

        if (!ambiguous) {
            const groups: Record<number, MultiFieldPair[]> = {};
            pairs.forEach(p => { 
                const rn = proposedRows[p.fieldId]; 
                if (rn == null) return; 
                (groups[rn] ||= []).push(p); 
            });

            const assignments = Object.entries(groups).flatMap(([rowStr, ps]) => ps.map(p => ({ pair: p, rowNumber: parseInt(rowStr,10) })));
            let poAfter = purchaseOrder;
            const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
            commitColumnAssignments({ column, assignments, purchaseOrder, onUpdate: (po) => { poAfter = po; }, onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }) });
            if (poAfter !== purchaseOrder || tempUpdates.length) {
                applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
                tempUpdates.forEach(u => flashField(u.fieldId));
            }
            return;
        }

        const columnIsEmpty = (li: LineItem): boolean => {
            const colVal: any = (li as any)[column];
            if (column === 'quantity' || column === 'unitPrice') return colVal === 0;
            return typeof colVal === 'string' ? colVal.trim() === '' : false;
        };
        const existingLineNumbersSorted = [...purchaseOrder.lineItems].sort((a,b)=>a.lineNumber - b.lineNumber);
        const emptyExistingRows: number[] = existingLineNumbersSorted
            .filter(li => columnIsEmpty(li))
            .map(li => li.lineNumber);
        const used = new Set<number>(purchaseOrder.lineItems.map(li => li.lineNumber));
        Object.values(proposedRows).forEach(r => { if (r != null) used.add(r); });
        let emptyIdx = 0;
        const nextNewRowNumber = () => { let candidate = 1; while (used.has(candidate)) candidate++; return candidate; };
        pairs.forEach(p => {
            if (proposedRows[p.fieldId] == null) {
                if (emptyIdx < emptyExistingRows.length) {
                    const rowNum = emptyExistingRows[emptyIdx++];
                    proposedRows[p.fieldId] = rowNum; used.add(rowNum);
                } else {
                    const newRow = nextNewRowNumber();
                    proposedRows[p.fieldId] = newRow; used.add(newRow);
                }
            }
        });
        setRowMappingDialog({ column, drag: { pairs, boundingBoxIds: dragData.boundingBoxIds || [] }, proposedRows });
    };

    const applyRowMapping = () => {
        if (!rowMappingDialog) return;
        const { column, drag, proposedRows } = rowMappingDialog;
        const groups: Record<number, MultiFieldPair[]> = {};
        drag.pairs.forEach(p => {
            const rn = proposedRows[p.fieldId];
            if (rn == null) return;
            if (!groups[rn]) groups[rn] = [];
            groups[rn].push(p);
        });
        const assignments = Object.entries(groups).flatMap(([rowStr, ps]) => ps.map(p => ({ pair: p, rowNumber: parseInt(rowStr,10) })));
        let poAfter = purchaseOrder;
        const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
        commitColumnAssignments({ column, assignments, purchaseOrder, onUpdate: (po) => { poAfter = po; }, onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }) });
        if (poAfter !== purchaseOrder || tempUpdates.length) {
            applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
            tempUpdates.forEach(u => flashField(u.fieldId));
        }
        setRowMappingDialog(null);
    };

    const cancelRowMapping = () => setRowMappingDialog(null);

    const applyMultiFieldMapping = () => {
        if (!columnMappingDialog) return;
        const { lineNumber, drag, proposed } = columnMappingDialog;
        let poAfter = purchaseOrder;
        const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
        commitMapping({
            lineNumber,
            pairs: drag.pairs,
            proposed,
            purchaseOrder,
            onUpdate: (po) => { poAfter = po; },
            onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }),
        });
        if (poAfter !== purchaseOrder || tempUpdates.length) {
            applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
            tempUpdates.forEach(u => flashField(u.fieldId));
        }
        setColumnMappingDialog(null);
    };

    const cancelMultiFieldMapping = () => setColumnMappingDialog(null);

    const renderLineItemCard = (item: LineItem) => {
        const isRowDropActive = activeRowDropLine === item.lineNumber;
        return (
            <LineItemCard
                key={item.lineNumber}
                item={item}
                isRowDropActive={isRowDropActive}
                onRowDragOver={(e) => {
                    if (e.dataTransfer.types.includes('application/json')) {
                        e.preventDefault();
                        if (activeRowDropLine !== item.lineNumber) {
                            setActiveRowDropLine(item.lineNumber);
                        }
                    }
                }}
                onRowDragLeave={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
                    setActiveRowDropLine((prev) => (prev === item.lineNumber ? null : prev));
                }}
                onRowDrop={(e) => { setActiveRowDropLine(null); handleRowDrop(e, item.lineNumber); }}
                onInsertRelative={(before) => handleInsertLineRelative(item.lineNumber, { before })}
                onRemove={() => handleRemoveLineItem(item.lineNumber)}
                getTextFieldSx={getTextFieldSx}
                activeColumnDrop={activeColumnDrop}
                setActiveColumnDrop={setActiveColumnDrop}
                onFieldFocus={(fid) => { setFocusedFieldIdLocal(fid); onFieldFocus?.(fid); }}
                onFieldBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus?.(null); }}
                handleLineItemChange={handleLineItemChange}
                clearLineItemField={clearLineItemField}
                handleLineItemDrop={handleLineItemDrop}
            />
        );
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                borderRadius: 2,
                backgroundColor: 'background.paper',
            }}
            onClick={handleFormClick}
        >
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
                data-scroll-listener
            >
                <Typography variant="h5" fontWeight={600} color="text.primary">
                    Purchase Order Form
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
                            General
                        </Typography>
                        <Stack spacing={2}>
                            {BASIC_FIELD_CONFIGS.map((config) => {
                                const value = purchaseOrder[config.id] as string;
                                const baseSx = getTextFieldSx(config.id);
                                const isBasicDropActive = activeBasicDrop === config.id;
                                return (
                                    <Box key={config.id}>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                            {config.label}
                                        </Typography>
                                        <BasicFieldInput
                                            id={config.id}
                                            value={value}
                                            kind={config.kind}
                                            multiline={config.multiline}
                                            rows={config.rows}
                                            baseSx={baseSx}
                                            isDropActive={!!isBasicDropActive}
                                            ariaLabel={config.label}
                                            onChange={(val) => handleBasicInfoChange(config.id, val, config.kind)}
                                            onClear={() => clearBasicField(config.id, config.kind)}
                                            onFocus={() => { setFocusedFieldIdLocal(config.id); onFieldFocus?.(config.id); }}
                                            onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus?.(null); }}
                                            onDragOver={(e) => {
                                                if (e.dataTransfer.types.includes('application/json')) {
                                                    e.preventDefault();
                                                    if (!isBasicDropActive) setActiveBasicDrop(config.id);
                                                }
                                            }}
                                            onDragLeave={(e) => {
                                                const next = e.relatedTarget as Node | null;
                                                if (next && (e.currentTarget as HTMLElement).contains(next)) {
                                                    return;
                                                }
                                                setActiveBasicDrop((prev) => (prev === config.id ? null : prev));
                                            }}
                                            onDrop={(e) => {
                                                setActiveBasicDrop(null);
                                                handleBasicDrop(e, config.id, config.kind);
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>

                    <Box
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                            Line Items
                        </Typography>

                        {purchaseOrder.lineItems.length > 0 ? (
                            <>
                                <ColumnDropHeader
                                    columns={LINE_ITEM_COLUMNS}
                                    titleFor={(c) => humanizeColumnKey(c)}
                                    onDrop={(col, e) => handleColumnDrop(e, col)}
                                />
                                <Stack spacing={2} sx={{ pr: 0.5 }}>
                                    {purchaseOrder.lineItems.map((item) => renderLineItemCard(item))}
                                </Stack>
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No line items yet. Add one below or drop structured data to populate the table.
                            </Typography>
                        )}
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={addBlankLineItem}
                        onDragOver={(e) => {
                            if (e.dataTransfer.types.includes('application/json')) {
                                e.preventDefault();
                                if (!addButtonDragActive) setAddButtonDragActive(true);
                            }
                        }}
                        onDragLeave={(e) => {
                            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                                setAddButtonDragActive(false);
                            }
                        }}
                        onDrop={(e) => {
                            setAddButtonDragActive(false);
                            handleAddLineItemDrop(e);
                        }}
                        sx={{
                            alignSelf: 'flex-start',
                            borderRadius: 999,
                            px: 2.5,
                            py: 1,
                            fontWeight: 600,
                            ...(addButtonDragActive
                                ? {
                                    border: '2px dashed rgba(44,123,229,0.75)',
                                    backgroundColor: 'rgba(44,123,229,0.12)',
                                    color: 'primary.main',
                                }
                                : {}),
                        }}
                    >
                        Add Line Item
                    </Button>
                </Box>
            </Box>

            {columnMappingDialog && (
                <ColumnMappingDialog
                    lineNumber={columnMappingDialog.lineNumber}
                    pairs={columnMappingDialog.drag.pairs}
                    proposed={columnMappingDialog.proposed}
                    onChange={(updates) => setColumnMappingDialog((prev) => (prev ? { ...prev, proposed: updates } : prev))}
                    onApply={applyMultiFieldMapping}
                    onCancel={cancelMultiFieldMapping}
                />
            )}
            {rowMappingDialog && (
                <RowMappingDialog
                    column={rowMappingDialog.column}
                    pairs={rowMappingDialog.drag.pairs}
                    proposedRows={rowMappingDialog.proposedRows}
                    onChange={(updates) => setRowMappingDialog((prev) => (prev ? { ...prev, proposedRows: updates } : prev))}
                    onApply={applyRowMapping}
                    onCancel={cancelRowMapping}
                />
            )}
        </Box>
    );
};

export default Form;