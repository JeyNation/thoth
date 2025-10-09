'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrashIcon, CloseIcon } from '../ui';
import type { PurchaseOrder, LineItem } from '../types/PurchaseOrder';
import './Form.css';
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

function getFieldKind(target: EventTarget | null): string | undefined {
    if (!target)
        return undefined;
    
    if (!(target instanceof HTMLElement))
        return undefined;
    
    const el = target.closest('[data-field-kind]') as (HTMLElement | null);
    const kind = el?.getAttribute('data-field-kind');
    
    if (kind === 'text' || kind === 'textarea' || kind === 'integer' || kind === 'decimal')
        return kind;

    return undefined;
}

const Form: React.FC<FormProps> = ({ onUpdate, onFieldFocus, clearPersistentFocus, focusedBoundingBoxId }) => {
    const { fieldSources, reverseIndex, purchaseOrder, applyTransaction } = useMapping();
    //const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [columnMappingDialog, setColumnMappingDialog] = useState<null | { lineNumber: number; drag: MultiFieldDragData; proposed: Record<string, LineItemColumnKey | ''> }>(null);
    const [rowMappingDialog, setRowMappingDialog] = useState<null | { column: LineItemColumnKey; drag: MultiFieldDragData; proposedRows: Record<string, number | null> }>(null);
    const [addButtonDragActive, setAddButtonDragActive] = useState(false);
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

    // Helper: build class list for a given fieldId
    const getInputClass = (base: string, fieldId: string) => {
        const hasOwnLinks = linkedFieldIdSet.has(fieldId);
        const isFormFocused = focusedFieldIdLocal === fieldId;
        const linkedViaFocusedBox = focusedLinkedFieldIds.has(fieldId);
        const shouldHighlight = (hasOwnLinks && isFormFocused) || linkedViaFocusedBox;
        return `${base}${shouldHighlight ? ' focused-linked' : ''}`;
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

    const handleBasicDrop = (e: React.DragEvent, targetField: string) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) { console.warn('No drag data found'); return; }
        let dragData: any; try { dragData = JSON.parse(data); } catch { return; }
        const mappingUpdates = dragData.boundingBoxIds ? [{ fieldId: targetField, sourceIds: dragData.boundingBoxIds as string[] }] : [];
        const kind = getFieldKind(e.target) ?? 'text';
        const processedText = sanitizeText(dragData.text, kind);
        const updated = { ...purchaseOrder, [targetField]: processedText };
        applyTransaction({ mappingUpdates, purchaseOrder: updated }); // no onUpdate duplication
    };

    const handleLineItemDrop = (e: React.DragEvent, lineNumber: number, targetField: string) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) { console.warn('No drag data found'); return; }
        let dragData: any; try { dragData = JSON.parse(data); } catch { return; }
        const mappingUpdates = dragData.boundingBoxIds ? [{ fieldId: makeLineItemField(lineNumber, targetField as any), sourceIds: dragData.boundingBoxIds as string[] }] : [];
        const kind = getFieldKind(e.target) ?? 'text';
        const processedText = sanitizeText(dragData.text, kind);
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
        commitMapping({ lineNumber, pairs: drag.pairs, proposed, purchaseOrder, onUpdate: (po)=>{ poAfter = po; }, onFieldSourceUpdate: (fid, ids)=> tempUpdates.push({ fieldId: fid, sourceIds: ids }) });
        if (poAfter !== purchaseOrder || tempUpdates.length) {
            applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
        }
    setColumnMappingDialog(null);
    };

    const cancelMultiFieldMapping = () => setColumnMappingDialog(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const getDropZoneStyle = (isActive: boolean) => ({
        border: isActive ? '2px dashed #007bff' : '2px dashed transparent',
        borderRadius: '4px',
        padding: '2px',
        transition: 'border-color 0.2s ease'
    });

    return (
        <div className="purchase-order-form" onClick={handleFormClick}>
            <h2>Purchase Order Form</h2>

            <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-group">
                <label htmlFor="documentNumber">Document Number:</label>
                <div 
                    style={getDropZoneStyle(false)}
                    onDrop={(e) => handleBasicDrop(e, 'documentNumber')}
                    onDragOver={handleDragOver}
                    className="input-wrapper"
                >
                    <input
                        type="text"
                        id="documentNumber"
                        value={purchaseOrder.documentNumber}
                        data-field-kind="text"
                        onChange={(e) => {
                            const val = e.target.value;
                            handleBasicInfoChange('documentNumber', val, 'text');
                        }}
                        onFocus={() => { setFocusedFieldIdLocal('documentNumber'); onFieldFocus && onFieldFocus('documentNumber'); }}
                        onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                        className={getInputClass('po-input has-clear', 'documentNumber')}
                        placeholder="Enter document number or drag from document"
                    />
                    {purchaseOrder.documentNumber && (
                        <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearBasicField('documentNumber', 'text')}><CloseIcon size={10} /></button>
                    )}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="customerNumber">Customer Number:</label>
                <div 
                    style={getDropZoneStyle(false)}
                    onDrop={(e) => handleBasicDrop(e, 'customerNumber')}
                    onDragOver={handleDragOver}
                    className="input-wrapper"
                >
                    <input
                        type="text"
                        id="customerNumber"
                        value={purchaseOrder.customerNumber}
                        data-field-kind="text"
                        onChange={(e) => {
                            const val = e.target.value;
                            handleBasicInfoChange('customerNumber', val, 'text');
                        }}
                        onFocus={() => { setFocusedFieldIdLocal('customerNumber'); onFieldFocus && onFieldFocus('customerNumber'); }}
                        onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                        className={getInputClass('po-input has-clear', 'customerNumber')}
                        placeholder="Enter customer number or drag from document"
                    />
                    {purchaseOrder.customerNumber && (
                        <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearBasicField('customerNumber', 'text')}><CloseIcon size={10} /></button>
                    )}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="shipToAddress">Ship To Address:</label>
                <div 
                    style={getDropZoneStyle(false)}
                    onDrop={(e) => handleBasicDrop(e, 'shipToAddress')}
                    onDragOver={handleDragOver}
                    className="input-wrapper"
                >
                    <textarea
                        id="shipToAddress"
                        value={purchaseOrder.shipToAddress}
                        data-field-kind="textarea"
                        onChange={(e) => {
                            const val = e.target.value;
                            handleBasicInfoChange('shipToAddress', val, 'textarea');
                        }}
                        onFocus={() => { setFocusedFieldIdLocal('shipToAddress'); onFieldFocus && onFieldFocus('shipToAddress'); }}
                        onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                        className={getInputClass('po-input has-clear', 'shipToAddress')}
                        placeholder="Enter ship to address or drag from document"
                        rows={3}
                        style={{ paddingRight: '32px' }}
                    />
                    {purchaseOrder.shipToAddress && (
                        <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearBasicField('shipToAddress', 'textarea')}><CloseIcon size={10} /></button>
                    )}
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3>Line Items</h3>
                {purchaseOrder.lineItems.length > 0 && (
                    <table className="line-items-table">
                        <thead>
                            <tr>
                                <th className="line-number-col">Line #</th>
                                {LINE_ITEM_COLUMNS.map(col => (
                                    <DropZone
                                        key={col}
                                        as="th"
                                        onDrop={(e) => handleColumnDrop(e, col)}
                                        baseStyle={{
                                            position: 'relative',
                                            borderBottom: '2px solid #ccc',
                                            transition: 'background 0.15s ease, border-color 0.15s ease',
                                            textAlign: col === 'quantity' || col === 'unitPrice' ? 'right' : 'left'
                                        }}
                                        activeStyle={{
                                            borderBottom: '2px dashed #007bff',
                                            background: 'rgba(0,123,255,0.08)'
                                        }}
                                        title="Drop multiple selected fields here to auto-map and predict row"
                                    >
                                        {humanizeColumnKey(col)}
                                    </DropZone>
                                ))}
                                <th className="total-col">Total</th>
                                <th className="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                                            {purchaseOrder.lineItems.map((item) => (
                                                <tr key={item.lineNumber}>
                                    <td className="line-number-col">
                                        <DropZone
                                            onDrop={(e) => handleRowDrop(e, item.lineNumber)}
                                            baseStyle={{
                                                padding: '4px 6px',
                                                border: '2px dashed transparent',
                                                borderRadius: '4px',
                                                background: 'transparent',
                                                transition: 'border-color 0.15s ease, background 0.15s ease',
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                textAlign: 'center',
                                                cursor: 'copy'
                                            }}
                                            activeStyle={{
                                                border: '2px dashed #007bff',
                                                background: 'rgba(0,123,255,0.08)'
                                            }}
                                            title="Drop multiple selected source fields here to map them into this row"
                                        >
                                            {item.lineNumber}
                                        </DropZone>
                                    </td>
                                    <td>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                id={makeLineItemField(item.lineNumber,'sku')}
                                                value={item.sku}
                                                data-field-kind="text"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleLineItemChange(item.lineNumber, 'sku', val, 'text');
                                                }}
                                                className={getInputClass('po-input has-clear', makeLineItemField(item.lineNumber,'sku'))}
                                                onFocus={() => { const fid = makeLineItemField(item.lineNumber,'sku'); setFocusedFieldIdLocal(fid); onFieldFocus && onFieldFocus(fid); }}
                                                onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleLineItemDrop(e, item.lineNumber, 'sku')}
                                            />
                                            {item.sku && (
                                                <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearLineItemField(item.lineNumber, 'sku', 'text')}><CloseIcon size={10} /></button>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="input-wrapper">
                                            <textarea
                                                id={makeLineItemField(item.lineNumber,'description')}
                                                value={item.description}
                                                rows={2}
                                                data-field-kind="textarea"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleLineItemChange(item.lineNumber, 'description', val, 'textarea');
                                                }}
                                                className={getInputClass('po-input has-clear', makeLineItemField(item.lineNumber,'description'))}
                                                onFocus={() => { const fid = makeLineItemField(item.lineNumber,'description'); setFocusedFieldIdLocal(fid); onFieldFocus && onFieldFocus(fid); }}
                                                onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleLineItemDrop(e, item.lineNumber, 'description')}
                                                style={{ resize: 'vertical', paddingRight: '32px' }}
                                                placeholder="Enter or drop description"
                                            />
                                            {item.description && (
                                                <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearLineItemField(item.lineNumber, 'description', 'textarea')}><CloseIcon size={10} /></button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="right-col">
                                        <div className="input-wrapper">
                                            <input
                                                type="number"
                                                id={makeLineItemField(item.lineNumber,'quantity')}
                                                value={item.quantity}
                                                data-field-kind="integer"
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === '') {
                                                        handleLineItemChange(item.lineNumber,'quantity',0,'integer',{ explicitClear: true });
                                                    } else {
                                                        handleLineItemChange(item.lineNumber,'quantity', parseInt(raw) || 0,'integer');
                                                    }
                                                }}
                                                className={getInputClass('po-input has-clear', makeLineItemField(item.lineNumber,'quantity'))}
                                                min="0"
                                                onFocus={() => { const fid = makeLineItemField(item.lineNumber,'quantity'); setFocusedFieldIdLocal(fid); onFieldFocus && onFieldFocus(fid); }}
                                                onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleLineItemDrop(e, item.lineNumber, 'quantity')}
                                            />
                                            {item.quantity !== 0 && (
                                                <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearLineItemField(item.lineNumber, 'quantity', 'integer')}><CloseIcon size={10} /></button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="right-col">
                                        <div className="input-wrapper">
                                            <input
                                                type="number"
                                                id={makeLineItemField(item.lineNumber,'unitPrice')}
                                                value={item.unitPrice}
                                                data-field-kind="decimal"
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === '') {
                                                        handleLineItemChange(item.lineNumber,'unitPrice',0,'decimal',{ explicitClear: true });
                                                    } else {
                                                        handleLineItemChange(item.lineNumber,'unitPrice', parseFloat(raw) || 0,'decimal');
                                                    }
                                                }}
                                                className={getInputClass('po-input has-clear', makeLineItemField(item.lineNumber,'unitPrice'))}
                                                min="0"
                                                step="0.01"
                                                onFocus={() => { const fid = makeLineItemField(item.lineNumber,'unitPrice'); setFocusedFieldIdLocal(fid); onFieldFocus && onFieldFocus(fid); }}
                                                onBlur={() => { setFocusedFieldIdLocal(null); onFieldFocus && onFieldFocus(null); }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleLineItemDrop(e, item.lineNumber, 'unitPrice')}
                                            />
                                            {item.unitPrice !== 0 && (
                                                <button type="button" className="clear-btn" aria-label="Clear" onClick={() => clearLineItemField(item.lineNumber, 'unitPrice', 'decimal')}><CloseIcon size={10} /></button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="total-col">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                    <td>
                                        <div style={{ display:'flex', gap:'6px', justifyContent:'center' }}>
                                            <button
                                                onClick={() => handleInsertLineBelow(item.lineNumber)}
                                                className="insert-btn"
                                                aria-label={`Insert line after ${item.lineNumber}`}
                                                title={`Insert line after ${item.lineNumber}`}
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => handleRemoveLineItem(item.lineNumber)}
                                                className="remove-btn"
                                                aria-label={`Remove line ${item.lineNumber}`}
                                                title={`Remove line ${item.lineNumber}`}
                                            >
                                                <span style={{ display:'flex' }}><TrashIcon size={16} /></span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div style={{ marginTop: '12px' }}>
                    <button
                        type="button"
                        className={`add-button${addButtonDragActive ? ' drop-active' : ''}`}
                        title="Click to add a blank row or drop selected fields here to create & auto-map"
                        onClick={addBlankLineItem}
                        onDragOver={(e) => {
                            if (e.dataTransfer.types.includes('application/json')) {
                                e.preventDefault();
                                if (!addButtonDragActive) setAddButtonDragActive(true);
                            }
                        }}
                        onDragLeave={(e) => {
                            // Only reset if leaving the button (relatedTarget might be a child)
                            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                                setAddButtonDragActive(false);
                            }
                        }}
                        onDrop={(e) => {
                            setAddButtonDragActive(false);
                            handleAddLineItemDrop(e);
                        }}
                    >
                        Add Line Item
                    </button>
                </div>
            </div>
        
                                    {columnMappingDialog && (
                            <ColumnMappingDialog
                                            lineNumber={columnMappingDialog.lineNumber}
                                            pairs={columnMappingDialog.drag.pairs}
                                            proposed={columnMappingDialog.proposed}
                                            onChange={(updates) => setColumnMappingDialog(prev => prev ? { ...prev, proposed: updates } : prev)}
                onApply={applyMultiFieldMapping}
                onCancel={cancelMultiFieldMapping}
              />
            )}
            {rowMappingDialog && (
              <RowMappingDialog
                column={rowMappingDialog.column}
                pairs={rowMappingDialog.drag.pairs}
                proposedRows={rowMappingDialog.proposedRows}
                onChange={(updates) => setRowMappingDialog(prev => prev ? { ...prev, proposedRows: updates } : prev)}
                onApply={applyRowMapping}
                onCancel={cancelRowMapping}
              />
            )}
        </div>
    );
};

// Inline helper component: create a new row number
export default Form;