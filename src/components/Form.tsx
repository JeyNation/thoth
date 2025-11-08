'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

import { BASIC_INFO_FIELDS, type FormFieldConfig } from '../config/formFields';
import { useMapping } from '../context/MappingContext';
import useFlashHighlight from '../hooks/useFlashHighlight';
import { getTextFieldSxFor } from '../styles/fieldStyles';
import {
  FORM_ROOT_SX,
  FORM_SCROLL_AREA_SX,
  FORM_SECTION_CONTAINER_SX,
  FORM_CAPTION_UPPER_SX,
  FORM_LINE_ITEMS_STACK_SX,
  FORM_ADD_BUTTON_BASE_SX,
  FORM_ADD_BUTTON_ACTIVE_SX,
} from '../styles/formStyles';
import { makeLineItemField } from '../types/fieldIds';
import {
  LINE_ITEM_COLUMNS,
  humanizeColumnKey,
  type LineItemColumnKey,
} from '../types/lineItemColumns';
import type { MultiFieldPair } from '../types/mapping';
import type { PurchaseOrder, LineItem } from '../types/PurchaseOrder';
import { remapFieldSourcesForInsertion } from '../utils/mappingRemap';
import {
  addBlankLineItem as poAddBlankLineItem,
  removeLineItem,
  computeNextLineNumber,
  ensureLineNumberExists,
  insertBlankLineItem,
} from '../utils/purchaseOrderMutations';
import { SectionLabel } from './ARCHIVED_common/SectionLabel';
import { SubsectionLabel } from './ARCHIVED_common/SubsectionLabel';
import ColumnMappingDialog from './dialogs/ColumnMappingDialog';
import RowMappingDialog from './dialogs/RowMappingDialog';
import {
  predictRow,
  sanitizeText,
  commitMapping,
  predictColumn,
  commitColumnAssignments,
} from '../utils/formUtils';
import ColumnDropZone from './form/ColumnDropZone';
import FieldInput from './form/FieldInput';
import LineItemCard from './form/LineItemCard';
import { EmptyDataIndicator } from './ui/Feedback';

type BasicFieldKey = Exclude<keyof PurchaseOrder, 'lineItems'>;

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

const Form: React.FC<FormProps> = ({
  onUpdate,
  onFieldFocus,
  clearPersistentFocus,
  focusedBoundingBoxId,
}) => {
  const [columnMappingDialog, setColumnMappingDialog] = useState<null | {
    lineNumber: number;
    drag: MultiFieldDragData;
    proposed: Record<string, LineItemColumnKey | ''>;
  }>(null);
  const [rowMappingDialog, setRowMappingDialog] = useState<null | {
    column: LineItemColumnKey;
    drag: MultiFieldDragData;
    proposedRows: Record<string, number | null>;
  }>(null);
  const [addButtonDragActive, setAddButtonDragActive] = useState(false);
  const [activeRowDropLine, setActiveRowDropLine] = useState<number | null>(null);
  const [activeColumnDrop, setActiveColumnDrop] = useState<{
    lineNumber: number;
    field: LineItemColumnKey;
  } | null>(null);
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
    return getTextFieldSxFor(highlight, stage) as unknown as Record<string, unknown>;
  };

  useEffect(() => {
    if (!initializedRef.current && purchaseOrder.lineItems.length === 0) {
      initializedRef.current = true;
      const firstLine: LineItem = {
        lineNumber: 1,
        sku: '',
        description: '',
        quantity: 0,
        unitPrice: 0,
      };
      onUpdate({
        ...purchaseOrder,
        lineItems: [firstLine],
      });
    }
  }, [purchaseOrder, onUpdate]);

  const handleBasicInfoChange = (
    field: string,
    value: string | number,
    kind: string = 'text',
    opts?: { explicitClear?: boolean },
  ) => {
    let nextVal: string | number = value;
    if (opts?.explicitClear) {
      nextVal = kind === 'integer' || kind === 'decimal' ? 0 : '';
    }
    const updated = { ...purchaseOrder, [field]: nextVal } as PurchaseOrder;
    const mappingUpdates: { fieldId: string; sourceIds: string[] }[] = [];
    const stringy = typeof nextVal === 'string' ? nextVal.trim() : null;
    const shouldClearSources =
      (opts?.explicitClear && (nextVal === '' || nextVal === 0)) ||
      (typeof nextVal === 'string' && stringy === '');
    if (shouldClearSources) {
      mappingUpdates.push({ fieldId: field, sourceIds: [] });
    }
    applyTransaction({ mappingUpdates, purchaseOrder: updated });
  };

  const handleLineItemChange = (
    lineNumber: number,
    field: string,
    value: string | number,
    kind: string = 'text',
    opts?: { explicitClear?: boolean },
  ) => {
    let nextVal: string | number = value;
    if (opts?.explicitClear) {
      nextVal = kind === 'integer' || kind === 'decimal' ? 0 : '';
    }
    const updatedItems = purchaseOrder.lineItems.map(item =>
      item.lineNumber === lineNumber ? { ...item, [field]: nextVal } : item,
    );
    const updated = { ...purchaseOrder, lineItems: updatedItems } as PurchaseOrder;
    const fid = makeLineItemField(lineNumber, field as LineItemColumnKey);
    const mappingUpdates: { fieldId: string; sourceIds: string[] }[] = [];
    const stringy = typeof nextVal === 'string' ? nextVal.trim() : null;
    const shouldClearSources =
      (opts?.explicitClear && (nextVal === '' || nextVal === 0)) ||
      (typeof nextVal === 'string' && stringy === '');
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
    try {
      dragData = JSON.parse(data);
    } catch {
      return;
    }
    if (!dragData || !Array.isArray(dragData.pairs) || dragData.pairs.length === 0) return;

    const newLineNumber = getNextLineNumber();
    ensureSpecificLineExists(newLineNumber);
    openRowDropDialog(newLineNumber, dragData);
  };

  const handleRemoveLineItem = (lineNumber: number) => {
    const {
      purchaseOrder: next,
      removedFieldIds,
      remappedFieldIds,
    } = removeLineItem(purchaseOrder, lineNumber);
    if (next === purchaseOrder) return;
    const clears = removedFieldIds.map(fid => ({ fieldId: fid, sourceIds: [] as string[] }));
    const { updates: remapUpdates } = remapFieldSourcesForInsertion(fieldSources, remappedFieldIds);
    const mappingUpdates = [...clears, ...remapUpdates];
    applyTransaction({ mappingUpdates, purchaseOrder: next });
  };

  const handleInsertLineRelative = (lineNumber: number, options?: { before?: boolean }) => {
    const anchor = options?.before ? Math.max(lineNumber - 1, 0) : lineNumber;
    const {
      purchaseOrder: nextPO,
      remappedFieldIds,
      newLineNumber,
    } = insertBlankLineItem(purchaseOrder, anchor);
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

  const handleBasicDrop = (
    e: React.DragEvent,
    targetField: string,
    fieldKind: 'text' | 'textarea' | 'date' | 'decimal' | 'integer',
  ) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) {
      console.warn('No drag data found');
      return;
    }
    let dragData: unknown;
    try {
      dragData = JSON.parse(data);
    } catch {
      return;
    }

    if (!dragData || typeof dragData !== 'object') return;
    const parsed = dragData as { boundingBoxIds?: unknown; text?: unknown };

    const additive = e.ctrlKey || e.shiftKey;
    const droppedIds: string[] = Array.isArray(parsed.boundingBoxIds)
      ? (parsed.boundingBoxIds as string[])
      : [];
    const currentIds: string[] = fieldSources?.[targetField]?.ids || [];
    const nextIds = additive
      ? Array.from(new Set([...(currentIds || []), ...droppedIds]))
      : droppedIds;
    const mappingUpdates = droppedIds.length ? [{ fieldId: targetField, sourceIds: nextIds }] : [];
    const processedText = sanitizeText(String(parsed.text ?? ''), fieldKind);
    const rawCurrent = purchaseOrder[targetField as keyof PurchaseOrder];
    const currentValue: string = typeof rawCurrent === 'string' ? rawCurrent : '';
    const nextValue = additive
      ? currentValue
        ? fieldKind === 'textarea'
          ? `${currentValue}\n${processedText}`
          : `${currentValue} ${processedText}`
        : processedText
      : processedText;
    const updated = { ...purchaseOrder, [targetField]: nextValue };
    applyTransaction({ mappingUpdates, purchaseOrder: updated }); // no onUpdate duplication
    flashField(targetField);
  };

  const handleLineItemDrop = (
    e: React.DragEvent,
    lineNumber: number,
    targetField: string,
    fieldKind: 'text' | 'textarea' | 'integer' | 'decimal',
  ) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) {
      console.warn('No drag data found');
      return;
    }
    let dragData: unknown;
    try {
      dragData = JSON.parse(data);
    } catch {
      return;
    }
    const additive = e.ctrlKey || e.shiftKey;
    const key = targetField as LineItemColumnKey;
    const fid = makeLineItemField(lineNumber, key);
    const parsed =
      dragData && typeof dragData === 'object'
        ? (dragData as { boundingBoxIds?: unknown; text?: unknown })
        : null;
    const droppedIds: string[] =
      parsed && Array.isArray(parsed.boundingBoxIds) ? (parsed.boundingBoxIds as string[]) : [];
    const currentIds: string[] = fieldSources?.[fid]?.ids || [];
    const nextIds = additive
      ? Array.from(new Set([...(currentIds || []), ...droppedIds]))
      : droppedIds;
    const mappingUpdates = droppedIds.length ? [{ fieldId: fid, sourceIds: nextIds }] : [];
    const processedText = sanitizeText(parsed ? String(parsed.text ?? '') : '', fieldKind);
    const updatedItems = purchaseOrder.lineItems.map(item => {
      if (item.lineNumber !== lineNumber) return item;

      if (fieldKind === 'text' || fieldKind === 'textarea') {
        const currentVal = item[key] as unknown as string;
        const nextVal = additive
          ? currentVal
            ? fieldKind === 'textarea'
              ? `${currentVal}\n${processedText}`
              : `${currentVal} ${processedText}`
            : processedText
          : processedText;
        return { ...(item as LineItem), [key]: nextVal } as LineItem;
      }
      // numeric fields: convert processedText into a number
      const numericVal =
        fieldKind === 'integer' ? parseInt(processedText, 10) || 0 : parseFloat(processedText) || 0;
      return { ...(item as LineItem), [key]: numericVal } as LineItem;
    });
    const updated = { ...purchaseOrder, lineItems: updatedItems };
    applyTransaction({ mappingUpdates, purchaseOrder: updated }); // single history entry
    flashField(fid);
  };

  const handleColumnDrop = (e: React.DragEvent, column: LineItemColumnKey) => {
    e.preventDefault();

    const data = e.dataTransfer.getData('application/json');
    if (data) {
      let dragData: unknown;
      try {
        dragData = JSON.parse(data);
      } catch {
        dragData = null;
      }
      if (dragData && typeof dragData === 'object') {
        const parsed = dragData as MultiFieldDragPayload;
        if (Array.isArray(parsed.pairs) && parsed.pairs.length > 0) {
          openColumnDropDialog(column, parsed);
          return;
        }
      }
    }
    console.warn('No drag data found');
  };

  const handleRowDrop = (e: React.DragEvent, lineNumber: number) => {
    e.preventDefault();

    const data = e.dataTransfer.getData('application/json');
    if (data) {
      let dragData: unknown;
      try {
        dragData = JSON.parse(data);
      } catch {
        dragData = null;
      }
      if (dragData && typeof dragData === 'object') {
        const parsed = dragData as MultiFieldDragPayload;
        if (Array.isArray(parsed.pairs) && parsed.pairs.length > 0) {
          openRowDropDialog(lineNumber, parsed);
          return;
        }
      }
    }
    console.warn('No drag data found');
  };

  const openRowDropDialog = (lineNumber: number, dragData: MultiFieldDragPayload) => {
    const pairs: MultiFieldPair[] = dragData.pairs || [];
    if (!pairs.length) return;

    const sourcesWithGeometry = fieldSources
      ? Object.entries(fieldSources).map(([fieldId, entry]) => ({
          fieldId,
          ids: entry.ids,
          boxes: entry.boxes,
        }))
      : [];

    const result = predictRow(lineNumber, pairs, sourcesWithGeometry);

    const proposed: Record<string, LineItemColumnKey | ''> = {} as Record<
      string,
      LineItemColumnKey | ''
    >;
    let ambiguous = false;

    result.pairOverlaps.forEach(por => {
      const insideCols = (
        Object.entries(por.perColumn) as [LineItemColumnKey, { midpointInside: boolean }][]
      )
        .filter(([, v]) => v.midpointInside)
        .map(([col]) => col);
      if (insideCols.length === 1) {
        proposed[por.pair.fieldId] = insideCols[0];
      } else {
        if (insideCols.length > 1) {
          const counts = insideCols
            .map(col => ({ col, count: result.midpointHits[col] || 0 }))
            .sort((a, b) => b.count - a.count);
          if (
            counts.length &&
            (counts.length === 1 || counts[1].count === 0 || counts[0].count >= counts[1].count * 9)
          ) {
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
        onUpdate: po => {
          poAfter = po;
        },
        onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }),
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
        boundingBoxIds: dragData.boundingBoxIds || [],
      },
      proposed,
    });
  };

  const openColumnDropDialog = (column: LineItemColumnKey, dragData: MultiFieldDragPayload) => {
    const pairs: MultiFieldPair[] = dragData.pairs || [];
    if (!pairs.length) return;
    const sourcesWithGeometry = fieldSources
      ? Object.entries(fieldSources).map(([fieldId, entry]) => ({
          fieldId,
          ids: entry.ids,
          boxes: entry.boxes,
        }))
      : [];
    const result = predictColumn(0, pairs, sourcesWithGeometry);

    const proposedRows: Record<string, number | null> = {};
    let ambiguous = false;

    result.rowPairOverlaps.forEach(rpo => {
      const insideRows = Object.entries(rpo.perRow)
        .filter(([, v]) => v.midpointInside)
        .map(([rowStr]) => parseInt(rowStr, 10));
      if (insideRows.length === 1) {
        proposedRows[rpo.pair.fieldId] = insideRows[0];
        return;
      }
      if (insideRows.length > 1) {
        const counts = insideRows
          .map(rn => ({ rn, count: result.midpointHits[rn] || 0 }))
          .sort((a, b) => b.count - a.count);

        if (
          counts.length &&
          (counts.length === 1 || counts[1].count === 0 || counts[0].count >= counts[1].count * 9)
        ) {
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

      const assignments = Object.entries(groups).flatMap(([rowStr, ps]) =>
        ps.map(p => ({ pair: p, rowNumber: parseInt(rowStr, 10) })),
      );
      let poAfter = purchaseOrder;
      const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
      commitColumnAssignments({
        column,
        assignments,
        purchaseOrder,
        onUpdate: po => {
          poAfter = po;
        },
        onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }),
      });
      if (poAfter !== purchaseOrder || tempUpdates.length) {
        applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
        tempUpdates.forEach(u => flashField(u.fieldId));
      }
      return;
    }

    // Positional suggestion fill:
    // - If a pair sits BETWEEN two already-mapped rows (by geometry order), suggest the PRECEDING row (e.g., 1, 2, 2(new), 2(new), 3 ...)
    // - If a pair is BELOW all mapped rows, suggest new increasing rows beyond current max (e.g., 10, 11, 12 ...)
    // - If a pair is ABOVE all mapped rows, default to the next assigned row (keeps ordering intuitive)
    // Build quick lookup for pair midpoint Y from prediction result
    const yByFieldId: Record<string, number | null> = {};
    result.rowPairOverlaps.forEach(rpo => {
      yByFieldId[rpo.pair.fieldId] = rpo.midpointY ?? null;
    });
    // Stable order by geometry (fallback to original order if Y is missing)
    const ordered = [...pairs].sort((a, b) => {
      const ya = yByFieldId[a.fieldId] ?? Infinity;
      const yb = yByFieldId[b.fieldId] ?? Infinity;
      if (ya === yb) return 0;
      return ya < yb ? -1 : 1;
    });
    // Seed used rows with rows that already have NON-empty values in the target column,
    // plus any rows already proposed in this dialog. This ensures we start at 1 when the
    // column is empty, and continue from max used when the column already has data.
    const colIsEmpty = (li: LineItem): boolean => {
      const colVal = li[column] as unknown;
      if (column === 'quantity' || column === 'unitPrice') return (colVal as number) === 0;
      return typeof colVal === 'string' ? (colVal as string).trim() === '' : false;
    };
    const used = new Set<number>();
    purchaseOrder.lineItems.forEach(li => {
      if (!colIsEmpty(li)) used.add(li.lineNumber);
    });
    Object.values(proposedRows).forEach(r => {
      if (r != null) used.add(r);
    });
    const maxUsed = used.size ? Math.max(0, ...Array.from(used)) : 0;
    let nextRowCounter = maxUsed + 1;
    const getNextNewRow = () => {
      while (used.has(nextRowCounter)) nextRowCounter++;
      used.add(nextRowCounter);
      return nextRowCounter++;
    };

    // Precompute assigned flags in ordered sequence
    const assignedInOrder: Array<number | null> = ordered.map(p => proposedRows[p.fieldId] ?? null);
    const nextAssignedToRight: Array<number | null> = new Array(ordered.length).fill(null);
    let lastSeen: number | null = null;
    // Walk from right to left to capture the next assigned row on the right
    for (let i = ordered.length - 1; i >= 0; i--) {
      const rn = assignedInOrder[i];
      if (rn != null) lastSeen = rn;
      nextAssignedToRight[i] = lastSeen;
    }

    let prevAssigned: number | null = null;
    for (let i = 0; i < ordered.length; i++) {
      const p = ordered[i];
      const current = proposedRows[p.fieldId];
      if (current != null) {
        prevAssigned = current;
        continue;
      }

      const nextAssigned = nextAssignedToRight[i];
      if (prevAssigned != null && nextAssigned != null) {
        // Between two assigned rows: assign to the preceding row as per UX requirement
        proposedRows[p.fieldId] = prevAssigned;
        // do not update prevAssigned to keep grouping for multiple betweens
        continue;
      }
      if (prevAssigned != null && nextAssigned == null) {
        // Below all assigned: allocate new increasing rows
        const newRow = getNextNewRow();
        proposedRows[p.fieldId] = newRow;
        prevAssigned = newRow; // extend the baseline downward
        continue;
      }
      if (prevAssigned == null && nextAssigned != null) {
        // Above all assigned: snap to the next assigned row
        proposedRows[p.fieldId] = nextAssigned;
        // Do not set prevAssigned yet; keep as null to allow additional aboves to snap to first known row
        continue;
      }
      // No anchors at all: start fresh from next increasing row
      const newRow = getNextNewRow();
      proposedRows[p.fieldId] = newRow;
      prevAssigned = newRow;
    }
    setRowMappingDialog({
      column,
      drag: { pairs, boundingBoxIds: dragData.boundingBoxIds || [] },
      proposedRows,
    });
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
    let assignments = Object.entries(groups).flatMap(([rowStr, ps]) =>
      ps.map(p => ({ pair: p, rowNumber: parseInt(rowStr, 10) })),
    );

    // Optional compression: if rows like 1,3,5 are selected and there is no conflict with existing
    // non-empty rows in the target column, compress to 1,2,3 while preserving relative order.
    if (assignments.length) {
      // Build dense mapping
      const uniqueRows = Array.from(new Set(assignments.map(a => a.rowNumber))).sort(
        (a, b) => a - b,
      );
      const denseMap = new Map<number, number>();
      uniqueRows.forEach((r, idx) => denseMap.set(r, idx + 1));

      // Determine conflicts: if any compressed target row already exists and has a non-empty value for the column
      const columnIsEmpty = (li: LineItem): boolean => {
        const colVal = li[column] as unknown;
        if (column === 'quantity' || column === 'unitPrice') return (colVal as number) === 0;
        return typeof colVal === 'string' ? (colVal as string).trim() === '' : false;
      };
      let hasConflict = false;
      for (const a of assignments) {
        const newRow = denseMap.get(a.rowNumber)!;
        const existing = purchaseOrder.lineItems.find(li => li.lineNumber === newRow);
        if (existing && !columnIsEmpty(existing)) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        assignments = assignments.map(a => ({
          pair: a.pair,
          rowNumber: denseMap.get(a.rowNumber)!,
        }));
      }
    }
    let poAfter = purchaseOrder;
    const tempUpdates: { fieldId: string; sourceIds: string[] }[] = [];
    commitColumnAssignments({
      column,
      assignments,
      purchaseOrder,
      onUpdate: po => {
        poAfter = po;
      },
      onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }),
    });
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
      onUpdate: po => {
        poAfter = po;
      },
      onFieldSourceUpdate: (fid, ids) => tempUpdates.push({ fieldId: fid, sourceIds: ids }),
    });
    if (poAfter !== purchaseOrder || tempUpdates.length) {
      applyTransaction({ mappingUpdates: tempUpdates, purchaseOrder: poAfter });
      tempUpdates.forEach(u => flashField(u.fieldId));
    }
    setColumnMappingDialog(null);
  };

  const cancelMultiFieldMapping = () => setColumnMappingDialog(null);

  // Global drag state to highlight all drop zones while dragging from viewer
  const [globalDragActive, setGlobalDragActive] = useState(false);
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      // If payload includes our app type, highlight drop zones
      const types = e.dataTransfer?.types;
      if (types && Array.from(types).includes('application/json')) {
        setGlobalDragActive(true);
      }
    };
    const onDragEnter = onDragOver;
    const clear = () => setGlobalDragActive(false);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragend', clear);
    window.addEventListener('drop', clear, true);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragend', clear);
      window.removeEventListener('drop', clear, true);
    };
  }, []);

  const renderLineItemCard = (item: LineItem) => {
    const isRowDropActive = activeRowDropLine === item.lineNumber;
    return (
      <LineItemCard
        key={item.lineNumber}
        item={item}
        externallyActive={globalDragActive}
        onRowDrop={e => {
          setActiveRowDropLine(null);
          handleRowDrop(e, item.lineNumber);
        }}
        onInsertRelative={before => handleInsertLineRelative(item.lineNumber, { before })}
        onRemove={() => handleRemoveLineItem(item.lineNumber)}
        getTextFieldSx={getTextFieldSx}
        activeColumnDrop={activeColumnDrop}
        setActiveColumnDrop={setActiveColumnDrop}
        onFieldFocus={fid => {
          setFocusedFieldIdLocal(fid);
          onFieldFocus?.(fid);
        }}
        onFieldBlur={() => {
          setFocusedFieldIdLocal(null);
          onFieldFocus?.(null);
        }}
        linkedFieldIdSet={linkedFieldIdSet}
        handleLineItemChange={handleLineItemChange}
        clearLineItemField={clearLineItemField}
        handleLineItemDrop={handleLineItemDrop}
      />
    );
  };

  return (
    <Box sx={FORM_ROOT_SX} onClick={handleFormClick}>
      <Box sx={FORM_SCROLL_AREA_SX} data-scroll-listener>
        <Box sx={FORM_SECTION_CONTAINER_SX}>
          <Box>
            <SectionLabel>General</SectionLabel>
            <Stack spacing={2}>
              {BASIC_INFO_FIELDS.map(config => {
                const fieldId = config.id as BasicFieldKey;
                const value = purchaseOrder[fieldId] as string;
                const baseSx = getTextFieldSx(fieldId);
                const isBasicDropActive = activeBasicDrop === fieldId;
                return (
                  <Box key={fieldId}>
                    <FieldInput
                      id={fieldId}
                      kind={config.kind}
                      label={config.label}
                      value={value}
                      isDragActive={!!isBasicDropActive || globalDragActive}
                      isLinked={linkedFieldIdSet.has(fieldId)}
                      onChange={val => handleBasicInfoChange(fieldId, val as string, config.kind)}
                      onClear={() => clearBasicField(fieldId, config.kind)}
                      onFocus={() => {
                        setFocusedFieldIdLocal(fieldId);
                        onFieldFocus?.(fieldId);
                      }}
                      onBlur={() => {
                        setFocusedFieldIdLocal(null);
                        onFieldFocus?.(null);
                      }}
                      onDragOver={e => {
                        if (e.dataTransfer.types.includes('application/json')) {
                          e.preventDefault();
                          if (!isBasicDropActive) setActiveBasicDrop(fieldId);
                        }
                      }}
                      onDragLeave={e => {
                        const next = e.relatedTarget as Node | null;
                        if (next && (e.currentTarget as HTMLElement).contains(next)) {
                          return;
                        }
                        setActiveBasicDrop(prev => (prev === fieldId ? null : prev));
                      }}
                      onDrop={e => {
                        setActiveBasicDrop(null);
                        handleBasicDrop(e, fieldId, config.kind);
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <SectionLabel>Line Items</SectionLabel>

            {purchaseOrder.lineItems.length > 0 ? (
              <>
                <ColumnDropZone
                  columns={LINE_ITEM_COLUMNS}
                  titleFor={c => humanizeColumnKey(c)}
                  onDrop={(col, e) => handleColumnDrop(e, col)}
                  externallyActive={globalDragActive}
                />
                <Stack spacing={2} sx={FORM_LINE_ITEMS_STACK_SX}>
                  {purchaseOrder.lineItems.map(item => renderLineItemCard(item))}
                </Stack>
              </>
            ) : (
              <EmptyDataIndicator
                title={'No line items yet.'}
                description={'Add one below or drop structured data to populate the table.'}
              />
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={addBlankLineItem}
            onDragOver={e => {
              if (e.dataTransfer.types.includes('application/json')) {
                e.preventDefault();
                if (!addButtonDragActive) setAddButtonDragActive(true);
              }
            }}
            onDragLeave={e => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                setAddButtonDragActive(false);
              }
            }}
            onDrop={e => {
              setAddButtonDragActive(false);
              handleAddLineItemDrop(e);
            }}
            sx={
              [
                FORM_ADD_BUTTON_BASE_SX,
                addButtonDragActive ? FORM_ADD_BUTTON_ACTIVE_SX : undefined,
              ] as unknown as SxProps<Theme>
            }
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
          onChange={updates =>
            setColumnMappingDialog(prev => (prev ? { ...prev, proposed: updates } : prev))
          }
          onApply={applyMultiFieldMapping}
          onCancel={cancelMultiFieldMapping}
        />
      )}
      {rowMappingDialog && (
        <RowMappingDialog
          column={rowMappingDialog.column}
          pairs={rowMappingDialog.drag.pairs}
          proposedRows={rowMappingDialog.proposedRows}
          onChange={updates =>
            setRowMappingDialog(prev => (prev ? { ...prev, proposedRows: updates } : prev))
          }
          onApply={applyRowMapping}
          onCancel={cancelRowMapping}
        />
      )}
    </Box>
  );
};

export default Form;
