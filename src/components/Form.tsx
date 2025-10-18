'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Box, Button, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import type { Theme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import type { PurchaseOrder, LineItem } from '../types/PurchaseOrder';
import DropZone from './DropZone';
import { makeLineItemField } from '../types/fieldIds';
import { addBlankLineItem as poAddBlankLineItem, removeLineItem, computeNextLineNumber, ensureLineNumberExists, insertBlankLineItem } from '../utils/purchaseOrderMutations';
import { remapFieldSourcesForInsertion } from '../utils/mappingRemap';
import type { MultiFieldPair } from '../types/mapping';
import { useMapping } from '../context/MappingContext';
import ColumnMappingDialog from './dialogs/ColumnMappingDialog';
import RowMappingDialog from './dialogs/RowMappingDialog';
import { LINE_ITEM_COLUMNS, humanizeColumnKey, type LineItemColumnKey } from '../types/lineItemColumns';
import { predictRow, sanitizeText, commitMapping, predictColumn, commitColumnAssignments } from '../utils/formUtils';

type BasicFieldKey = Exclude<keyof PurchaseOrder, 'lineItems'>;

interface BasicFieldConfig {
    id: BasicFieldKey;
    label: string;
    kind: 'text' | 'textarea';
    multiline?: boolean;
    rows?: number;
    placeholder: string;
}

const BASIC_FIELD_CONFIGS: BasicFieldConfig[] = [
    {
        id: 'documentNumber',
        label: 'Document Number',
        kind: 'text',
        placeholder: 'Document Number',
    },
    {
        id: 'customerNumber',
        label: 'Customer Number',
        kind: 'text',
        placeholder: 'Customer Number',
    },
    {
        id: 'shipToAddress',
        label: 'Ship To Address',
        kind: 'textarea',
        multiline: true,
        rows: 3,
        placeholder: 'Ship To Address',
    },
];

const COLUMN_DROP_ZONE_BASE: CSSProperties = {
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(120, 144, 156, 0.45)',
    borderRadius: 10,
    background: 'rgba(248, 250, 252, 0.85)',
    padding: '6px 8px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: 40,
    transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: 'inset 0 0 0 0 rgba(25,118,210,0.08)',
};

const COLUMN_DROP_ZONE_ACTIVE: CSSProperties = {
    borderColor: 'rgba(25,118,210,0.65)',
    background: 'rgba(227,242,253,0.82)',
    boxShadow: 'inset 0 0 0 1px rgba(25,118,210,0.35)',
};

interface FormProps {
    onUpdate: (purchaseOrder: PurchaseOrder) => void; // optional external side-effects
    onFieldFocus?: (fieldId: string | null) => void;
    clearPersistentFocus?: () => void;
    focusedBoundingBoxId?: string | null;
}

interface MultiFieldDragData { pairs: MultiFieldPair[]; boundingBoxIds: string[]; }
interface MultiFieldDragPayload {
    isMultiField?: boolean;
    pairs?: MultiFieldPair[];
    boundingBoxIds?: string[];
}

const LINE_ITEM_FIELD_LABEL: Record<'sku' | 'description' | 'quantity' | 'unitPrice', string> = {
    sku: 'SKU',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
};

const Form: React.FC<FormProps> = ({ onUpdate, onFieldFocus, clearPersistentFocus, focusedBoundingBoxId }) => {
    const { fieldSources, reverseIndex, purchaseOrder, applyTransaction } = useMapping();
    //const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [columnMappingDialog, setColumnMappingDialog] = useState<null | { lineNumber: number; drag: MultiFieldDragData; proposed: Record<string, LineItemColumnKey | ''> }>(null);
    const [rowMappingDialog, setRowMappingDialog] = useState<null | { column: LineItemColumnKey; drag: MultiFieldDragData; proposedRows: Record<string, number | null> }>(null);
    const [addButtonDragActive, setAddButtonDragActive] = useState(false);
    const [activeRowDropLine, setActiveRowDropLine] = useState<number | null>(null);
    const [activeColumnDrop, setActiveColumnDrop] = useState<{ lineNumber: number; field: LineItemColumnKey } | null>(null);
    const [activeBasicDrop, setActiveBasicDrop] = useState<BasicFieldKey | null>(null);
    // Track which input is currently focused within this form (selection)
    const [focusedFieldIdLocal, setFocusedFieldIdLocal] = useState<string | null>(null);

    const initializedRef = useRef(false);

    // Memo: set of fieldIds that have at least one source mapping (used for quick highlight check)
    const linkedFieldIdSet = useMemo(() => {
        const s = new Set<string>();
        Object.entries(fieldSources).forEach(([fid, entry]) => { if (entry.ids && entry.ids.length) s.add(fid); });
        return s;
    }, [fieldSources]);

    // Memo: fields linked to currently focused bounding box id
    const focusedLinkedFieldIds = useMemo(() => {
        if (!focusedBoundingBoxId) return new Set<string>();
        if (reverseIndex && reverseIndex[focusedBoundingBoxId]) {
            return new Set(reverseIndex[focusedBoundingBoxId]);
        }
        // fallback scan (should be rare if reverseIndex provided)
        const s = new Set<string>();
        Object.entries(fieldSources).forEach(([fid, entry]) => { if (entry.ids.includes(focusedBoundingBoxId)) s.add(fid); });
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
        return {
            '& .MuiOutlinedInput-root': {
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
            },
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

    /**
     * Atomic update of a top-level (basic) field. If the resulting value is an empty string after trim (for text/textarea)
     * or a numeric reset (0 for integer/decimal via explicit clear), we also clear any linked field sources in the same transaction.
     */
    const handleBasicInfoChange = (field: string, value: string | number, kind: string = 'text', opts?: { explicitClear?: boolean }) => {
        let nextVal: any = value;
        if (opts?.explicitClear) {
            // For explicit clear button, normalize numeric kinds to 0, others to ''
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

    /**
     * Atomic update of a line item field; clears mapping sources for that field id in the same transaction when emptied/reset.
     */
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

    // Compute next available line number (fills gaps, else append)
    const getNextLineNumber = () => computeNextLineNumber(purchaseOrder);

    // Ensure a specific line number exists (used before mapping on Add Line Item drop)
    const ensureSpecificLineExists = (lineNumber: number) => {
        const updated = ensureLineNumberExists(purchaseOrder, lineNumber);
        if (updated !== purchaseOrder) applyTransaction({ mappingUpdates: [], purchaseOrder: updated });
    };

    // Handle dropping multi-field selection onto the Add Line Item control
    const handleAddLineItemDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        let dragData: MultiFieldDragPayload | null = null;
        try { dragData = JSON.parse(data); } catch { return; }
        if (!dragData || !Array.isArray(dragData.pairs) || dragData.pairs.length === 0) return;

        const newLineNumber = getNextLineNumber();
        // Create the row immediately so user sees it even if ambiguous dialog appears
        ensureSpecificLineExists(newLineNumber);
        // Reuse row drop logic
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

    const handleInsertLineBelow = (lineNumber: number) => {
        const { purchaseOrder: nextPO, remappedFieldIds, newLineNumber } = insertBlankLineItem(purchaseOrder, lineNumber);
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
        if (!data) { console.warn('No drag data found'); return; }
        let dragData: any; try { dragData = JSON.parse(data); } catch { return; }
        const mappingUpdates = dragData.boundingBoxIds ? [{ fieldId: targetField, sourceIds: dragData.boundingBoxIds as string[] }] : [];
        const processedText = sanitizeText(dragData.text, fieldKind);
        const updated = { ...purchaseOrder, [targetField]: processedText };
        applyTransaction({ mappingUpdates, purchaseOrder: updated }); // no onUpdate duplication
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
        const mappingUpdates = dragData.boundingBoxIds ? [{ fieldId: makeLineItemField(lineNumber, targetField as any), sourceIds: dragData.boundingBoxIds as string[] }] : [];
        const processedText = sanitizeText(dragData.text, fieldKind);
        const updatedItems = purchaseOrder.lineItems.map(item => item.lineNumber === lineNumber ? { ...item, [targetField]: processedText } : item);
        const updated = { ...purchaseOrder, lineItems: updatedItems };
        applyTransaction({ mappingUpdates, purchaseOrder: updated }); // single history entry
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
            // transactional capture – rely solely on applyTransaction to record history
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
            }
            return;
        }

    setColumnMappingDialog({
            lineNumber,
            drag: { pairs, boundingBoxIds: dragData.boundingBoxIds || [] },
            proposed
        });
    };

    const openColumnDropDialog = (column: LineItemColumnKey, dragData: MultiFieldDragPayload) => {
        const pairs: MultiFieldPair[] = dragData.pairs || [];
        if (!pairs.length) return;
        const sourcesWithGeometry = fieldSources ? Object.entries(fieldSources).map(([fieldId, entry]) => ({ fieldId, ids: entry.ids, boxes: entry.boxes })) : [];
        const result = predictColumn(0, pairs, sourcesWithGeometry);

        // Build proposed row assignments per pair
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
                const counts = insideRows.map(rn => ({ rn, count: result.midpointHits[rn] || 0 }))
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
            pairs.forEach(p => { const rn = proposedRows[p.fieldId]; if (rn == null) return; (groups[rn] ||= []).push(p); });
            const assignments = Object.entries(groups).flatMap(([rowStr, ps]) => ps.map(p => ({ pair: p, rowNumber: parseInt(rowStr,10) })));
            let poAfter = purchaseOrder;
            const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
            commitColumnAssignments({ column, assignments, purchaseOrder, onUpdate: (po) => { poAfter = po; }, onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }) });
            if (poAfter !== purchaseOrder || tempUpdates.length) {
                applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
            }
            return;
        }

        // Ambiguous path: propose rows heuristically using emptiness fill fallback
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
        }
        setColumnMappingDialog(null);
    };

    const cancelMultiFieldMapping = () => setColumnMappingDialog(null);

    const renderClearAdornment = (show: boolean, onClear: () => void): React.ReactNode => {
        if (!show) return undefined;
        return (
            <InputAdornment position="end">
                <Tooltip title="Clear field">
                    <IconButton
                        size="small"
                        edge="end"
                        aria-label="Clear field"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                            e.preventDefault();
                            onClear();
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </InputAdornment>
        );
    };

    const applyDropHighlightSx = (base: Record<string, any>): Record<string, any> => {
        const root = { ...(base['& .MuiOutlinedInput-root'] ?? {}) };
        const fieldset = { ...(root['& fieldset'] ?? {}) };
        const hoverFieldset = { ...(root['&:hover fieldset'] ?? {}) };
        const focusedFieldset = { ...(root['&.Mui-focused fieldset'] ?? {}) };

        return {
            ...base,
            '& .MuiOutlinedInput-root': {
                ...root,
                backgroundColor: 'rgba(227,242,253,0.82)',
                boxShadow: 'inset 0 0 0 1px rgba(25,118,210,0.35)',
                '& fieldset': {
                    ...fieldset,
                    borderWidth: 1,
                    borderColor: 'rgba(25,118,210,0.65)',
                },
                '&:hover fieldset': {
                    ...hoverFieldset,
                    borderColor: 'rgba(25,118,210,0.65)',
                },
                '&.Mui-focused fieldset': {
                    ...focusedFieldset,
                    borderColor: 'rgba(25,118,210,0.65)',
                    boxShadow: 'inset 0 0 0 1px rgba(25,118,210,0.35)',
                },
            },
        };
    };

    const renderLineItemInput = (item: LineItem, field: 'sku' | 'description' | 'quantity' | 'unitPrice') => {
        const fieldId = makeLineItemField(item.lineNumber, field);
        const kind: 'text' | 'textarea' | 'integer' | 'decimal' =
            field === 'description'
                ? 'textarea'
                : field === 'quantity'
                    ? 'integer'
                    : field === 'unitPrice'
                        ? 'decimal'
                        : 'text';
        const value = item[field];
        const showClear = kind === 'integer' || kind === 'decimal'
            ? value !== 0
            : typeof value === 'string' && value.trim() !== '';

        const handleClear = () => clearLineItemField(item.lineNumber, field, kind);

        const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const raw = event.target.value;
            if (kind === 'integer') {
                if (raw === '') {
                    handleLineItemChange(item.lineNumber, field, 0, kind, { explicitClear: true });
                } else {
                    handleLineItemChange(item.lineNumber, field, parseInt(raw, 10) || 0, kind);
                }
                return;
            }
            if (kind === 'decimal') {
                if (raw === '') {
                    handleLineItemChange(item.lineNumber, field, 0, kind, { explicitClear: true });
                } else {
                    handleLineItemChange(item.lineNumber, field, parseFloat(raw) || 0, kind);
                }
                return;
            }
            handleLineItemChange(item.lineNumber, field, raw, kind);
        };

        const isColumnDropActive =
            activeColumnDrop?.lineNumber === item.lineNumber && activeColumnDrop.field === field;
        const baseSx = getTextFieldSx(fieldId);
        const mergedSx = isColumnDropActive ? applyDropHighlightSx(baseSx) : baseSx;

        return (
            <TextField
                key={fieldId}
                fullWidth
                size="small"
                variant="outlined"
                value={value as string | number}
                type={kind === 'integer' || kind === 'decimal' ? 'number' : 'text'}
                placeholder={LINE_ITEM_FIELD_LABEL[field]}
                aria-label={`${LINE_ITEM_FIELD_LABEL[field]} for line ${item.lineNumber}`}
                multiline={kind === 'textarea'}
                minRows={kind === 'textarea' ? 2 : undefined}
                sx={mergedSx}
                onChange={handleChange}
                onFocus={() => { setFocusedFieldIdLocal(fieldId); onFieldFocus?.(fieldId); }}
                onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus?.(null); }}
                onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('application/json')) {
                        e.preventDefault();
                        if (!isColumnDropActive) {
                            setActiveColumnDrop({ lineNumber: item.lineNumber, field });
                        }
                    }
                }}
                onDragLeave={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && (e.currentTarget as HTMLElement).contains(next)) {
                        return;
                    }
                    setActiveColumnDrop((prev) =>
                        prev && prev.lineNumber === item.lineNumber && prev.field === field ? null : prev
                    );
                }}
                onDrop={(e) => {
                    setActiveColumnDrop(null);
                    handleLineItemDrop(e, item.lineNumber, field, kind);
                }}
                InputProps={{
                    endAdornment: renderClearAdornment(showClear, handleClear),
                    inputProps: {
                        'data-field-kind': kind,
                        ...(kind === 'integer' || kind === 'decimal'
                            ? { min: 0, step: kind === 'decimal' ? 0.01 : 1, style: { textAlign: 'right' } }
                            : {}),
                    },
                }}
            />
        );
    };

    const renderLineItemCard = (item: LineItem) => {
        const isRowDropActive = activeRowDropLine === item.lineNumber;

        return (
            <Paper
                key={item.lineNumber}
                variant="outlined"
                sx={{
                    borderRadius: 2,
                    borderColor: 'divider',
                }}
            >
                <Stack direction="row" spacing={0} alignItems="flex-start">
                    <Box
                        sx={{
                            width: 60,
                            alignSelf: 'stretch',
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                minHeight: 64,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: isRowDropActive ? 'rgba(25,118,210,0.65)' : 'transparent',
                                backgroundColor: isRowDropActive ? 'rgba(227,242,253,0.82)' : 'transparent',
                                boxShadow: isRowDropActive ? 'inset 0 0 0 1px rgba(25,118,210,0.35)' : 'none',
                                transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'copy',
                                p: 2,
                            }}
                            onDragOver={(e) => {
                                if (e.dataTransfer.types.includes('application/json')) {
                                    e.preventDefault();
                                    if (activeRowDropLine !== item.lineNumber) {
                                        setActiveRowDropLine(item.lineNumber);
                                    }
                                }
                            }}
                            onDragLeave={(e) => {
                                const next = e.relatedTarget as Node | null;
                                if (next && (e.currentTarget as HTMLElement).contains(next)) {
                                    return;
                                }
                                setActiveRowDropLine((prev) => (prev === item.lineNumber ? null : prev));
                            }}
                            onDrop={(e) => {
                                setActiveRowDropLine(null);
                                handleRowDrop(e, item.lineNumber);
                            }}
                            title="Drop multiple selected source fields here to map them into this row"
                        >
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1, paddingTop: '4px' }}>
                                {item.lineNumber}
                            </Typography>
                        </Box>
                    </Box>
                    <Stack spacing={0} useFlexGap sx={{ flex: 1, minWidth: 0, position: 'relative', p:2 }}>
                        <Stack direction="row" spacing={0} alignItems="flex-start" justifyContent="space-between">
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, paddingTop: '4px' }}>
                                ${ (item.quantity * item.unitPrice).toFixed(2) }
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                <Tooltip title={`Insert line after ${item.lineNumber}`}>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleInsertLineBelow(item.lineNumber)}
                                        sx={{ width: 32, height: 32 }}
                                        aria-label={`Insert line after ${item.lineNumber}`}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={`Remove line ${item.lineNumber}`}>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveLineItem(item.lineNumber)}
                                        sx={{ width: 32, height: 32 }}
                                        aria-label={`Remove line ${item.lineNumber}`}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                        <Stack spacing={1.5}>
                            {LINE_ITEM_COLUMNS.map((col) => (
                                <Box key={`${item.lineNumber}-${col}`}>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                        {humanizeColumnKey(col)}
                                    </Typography>
                                    {renderLineItemInput(item, col)}
                                </Box>
                            ))}
                        </Stack>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                borderRight: '1px solid',
                                borderColor: 'divider',
                            }}
                        />
                    </Stack>
                </Stack>
            </Paper>
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
                                const showClear = value.trim() !== '';
                                const handleClear = () => clearBasicField(config.id, config.kind);
                                const baseSx = getTextFieldSx(config.id);
                                const isBasicDropActive = activeBasicDrop === config.id;
                                return (
                                    <Box key={config.id}>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                            {config.label}
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={config.placeholder}
                                            variant="outlined"
                                            value={value}
                                            multiline={config.multiline}
                                            minRows={config.rows}
                                            sx={isBasicDropActive ? applyDropHighlightSx(baseSx) : baseSx}
                                            aria-label={config.label}
                                            onChange={(e) => handleBasicInfoChange(config.id, e.target.value, config.kind)}
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
                                            InputProps={{
                                                endAdornment: renderClearAdornment(showClear, handleClear),
                                                inputProps: { 'data-field-kind': config.kind, title: config.label },
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
                                <Box
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 5,
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            sm: 'repeat(2, minmax(0, 1fr))',
                                            md: 'repeat(4, minmax(0, 1fr))',
                                        },
                                        gap: 1,
                                        backgroundImage: (theme: Theme) => `linear-gradient(${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 60%, rgba(255,255,255,0) 100%)`,
                                        pb: 1,
                                    }}
                                >
                                    {LINE_ITEM_COLUMNS.map((col) => (
                                        <DropZone
                                            key={`compact-col-${col}`}
                                            onDrop={(e) => handleColumnDrop(e, col)}
                                            baseStyle={COLUMN_DROP_ZONE_BASE}
                                            activeStyle={COLUMN_DROP_ZONE_ACTIVE}
                                            title="Drop multiple selected fields here to auto-map and predict row"
                                        >
                                            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
                                                {humanizeColumnKey(col)}
                                            </Typography>
                                        </DropZone>
                                    ))}
                                </Box>
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

// Inline helper component: create a new row number
export default Form;