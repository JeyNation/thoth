import { parseIntegerSafe, parseDecimalSafe } from './numbers';
import { uniq } from './uniq';
import { EXTRACTION_FIELD_MAPPING } from '../config/formFields';
import { makeLineItemField, parseLineItemField } from '../types/fieldIds';
import { LINE_ITEM_COLUMNS, type LineItemColumnKey } from '../types/lineItemColumns';
import type { MultiFieldPair, SourceWithGeometry } from '../types/mapping';
import type { LineItem, PurchaseOrder } from '../types/PurchaseOrder';

/**
 * Converts a form field ID to its corresponding extraction field ID.
 * For example: 'documentNumber' -> 'document-number'
 * Falls back to the original field ID if no mapping is found.
 */
export const getExtractionFieldId = (formFieldId: string): string => {
  const extractionFieldId = Object.entries(EXTRACTION_FIELD_MAPPING).find(
    ([_, mappedFormFieldId]) => mappedFormFieldId === formFieldId
  )?.[0];
  
  return extractionFieldId || formFieldId;
};

export const sanitizeText = (raw: string, kind: string): string => {
  let processedText: string = raw ?? '';
  if (!kind || kind === 'text') {
    return processedText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (kind === 'textarea') {
    return processedText.trim();
  }
  if (kind === 'integer') {
    const intVal = parseIntegerSafe(processedText);
    return intVal == null ? '' : String(intVal);
  }
  if (kind === 'decimal') {
    const decVal = parseDecimalSafe(processedText);
    return decVal == null ? '' : String(decVal);
  }

  return processedText;
};

// SourceWithGeometry & MultiFieldPair now come from shared mapping types

export interface ColumnSpan { left: number; right: number; count: number; }
export interface ColumnGeometrySummary {
  columns: Record<LineItemColumnKey, ColumnSpan>;
  rawCount: number;
  pairOverlaps: PairOverlapResult[];
  midpointHits: Record<LineItemColumnKey, number>;
}
export interface RowSpan { top: number; bottom: number; count: number; }
export interface RowGeometrySummary {
  rows: Record<number, RowSpan>;
  rawCount: number;
  rowPairOverlaps: RowPairOverlapResult[];
  midpointHits: Record<number, number>; // keyed by row number
}

export interface RowPairOverlapResult {
  pair: MultiFieldPair;
  midpointY: number | null;
  pairHeight: number | null;
  perRow: Record<number, { overlapHeight: number; overlapRatio: number; midpointInside: boolean }>;
  bestRow?: number;
  bestOverlapRatio?: number;
}

// Field id parsing now handled by parseLineItemField helper.

// Aggregates ALL rows: for each column compute global min left, max right across every row entry.
export const predictRow = (
  targetLineNumber: number,
  _pairs: MultiFieldPair[],
  sources: SourceWithGeometry[]
): ColumnGeometrySummary => {
  // Reference LINE_ITEM_COLUMNS to satisfy usage (could be used for dynamic validation later)
  if (!LINE_ITEM_COLUMNS.length) throw new Error('No line item columns defined');
  const colMap: Record<LineItemColumnKey, ColumnSpan> = {
    sku: { left: Infinity, right: -Infinity, count: 0 },
    description: { left: Infinity, right: -Infinity, count: 0 },
    quantity: { left: Infinity, right: -Infinity, count: 0 },
    unitPrice: { left: Infinity, right: -Infinity, count: 0 }
  };

  let considered = 0;
  for (const src of sources) {
    const parsed = parseLineItemField(src.fieldId);
    if (!parsed) continue;
    const rowNum = parsed.lineNumber;
    if (rowNum === targetLineNumber) continue;
    const col = parsed.column;
    for (const b of src.boxes) {
      const span = colMap[col];
      if (b.left < span.left) span.left = b.left;
      if (b.right > span.right) span.right = b.right;
      span.count += 1;
    }
    considered += 1;
  }

  const midpointHits: Record<LineItemColumnKey, number> = { sku: 0, description: 0, quantity: 0, unitPrice: 0 };

  const pairOverlaps: PairOverlapResult[] = _pairs.map(pair => {
    const pairWidth = (pair.left != null && pair.right != null) ? Math.max(0, pair.right - pair.left) : null;
    const midpoint = (pair.left != null && pair.right != null) ? (pair.left + pair.right) / 2 : null;
    let bestColumn: LineItemColumnKey | undefined;
    let bestOverlapRatio = -1;
    const perColumn = {} as Record<LineItemColumnKey, { overlapWidth: number; overlapRatio: number; midpointInside: boolean }>;
    (Object.keys(colMap) as LineItemColumnKey[]).forEach(col => {
      const span = colMap[col];
      const validSpan = span.count > 0 && span.left !== Infinity && span.right !== -Infinity;
      if (!pairWidth || !validSpan || pair.left == null || pair.right == null) {
        perColumn[col] = { overlapWidth: 0, overlapRatio: 0, midpointInside: false };
        return;
      }
      const overlapWidth = Math.max(0, Math.min(pair.right, span.right) - Math.max(pair.left, span.left));
      const overlapRatio = pairWidth === 0 ? 0 : overlapWidth / pairWidth; // proportion of the pair covered by column span
      const midpointInside = midpoint != null && midpoint >= span.left && midpoint <= span.right;
      if (midpointInside) midpointHits[col] += 1;
      perColumn[col] = { overlapWidth, overlapRatio, midpointInside };
      if (overlapRatio > bestOverlapRatio) {
        bestOverlapRatio = overlapRatio;
        bestColumn = col;
      }
    });
    return { pair, midpoint, pairWidth, perColumn, bestColumn, bestOverlapRatio };
  });

  const summary: ColumnGeometrySummary = { columns: colMap, rawCount: considered, pairOverlaps, midpointHits };
  return summary;
};

export const predictColumn = (
  _targetLineNumber: number,
  _pairs: MultiFieldPair[],
  sources: SourceWithGeometry[]
): RowGeometrySummary => {
  // Determine vertical start (min top) and end (max bottom) for each existing line item row.
  // We include all rows found in sources (including targetLineNumber if present); caller can ignore if needed.
  const rows: Record<number, RowSpan> = {};
  let consideredSources = 0;
  for (const src of sources) {
    const parsed = parseLineItemField(src.fieldId);
    if (!parsed) continue; // skip non line-item mapped fields
    const rowNum = parsed.lineNumber;
    if (!rows[rowNum]) {
      rows[rowNum] = { top: Infinity, bottom: -Infinity, count: 0 };
    }
    const r = rows[rowNum];
    for (const box of src.boxes) {
      if (box.top < r.top) r.top = box.top;
      if (box.bottom > r.bottom) r.bottom = box.bottom;
      r.count += 1;
    }
    consideredSources += 1;
  }

  // Normalize any rows that had no boxes (defensive) and clamp infinities.
  Object.values(rows).forEach(r => {
    if (r.count === 0) { r.top = 0; r.bottom = 0; }
  });

  // Optional: derive midpoint hits for incoming pairs (vertical midpoint inside row span)
  const midpointHits: Record<number, number> = {};

  const rowPairOverlaps: RowPairOverlapResult[] = _pairs.map(pair => {
    const pairHeight = (pair.top != null && pair.bottom != null) ? Math.max(0, pair.bottom - pair.top) : null;
    const midpointY = (pair.top != null && pair.bottom != null) ? (pair.top + pair.bottom) / 2 : null;
    let bestRow: number | undefined;
    let bestOverlapRatio = -1;
    const perRow: Record<number, { overlapHeight: number; overlapRatio: number; midpointInside: boolean }> = {};
    Object.entries(rows).forEach(([rowStr, span]) => {
      const rowNum = parseInt(rowStr, 10);
      const valid = span.count > 0 && span.top !== Infinity && span.bottom !== -Infinity;
      if (!pairHeight || !valid || pair.top == null || pair.bottom == null) {
        perRow[rowNum] = { overlapHeight: 0, overlapRatio: 0, midpointInside: false };
        return;
      }
      const overlapHeight = Math.max(0, Math.min(pair.bottom, span.bottom) - Math.max(pair.top, span.top));
      const overlapRatio = pairHeight === 0 ? 0 : overlapHeight / pairHeight;
      const midpointInside = midpointY != null && midpointY >= span.top && midpointY <= span.bottom;
      if (midpointInside) midpointHits[rowNum] = (midpointHits[rowNum] || 0) + 1;
      perRow[rowNum] = { overlapHeight, overlapRatio, midpointInside };
      if (overlapRatio > bestOverlapRatio) {
        bestOverlapRatio = overlapRatio;
        bestRow = rowNum;
      }
    });
    return { pair, midpointY, pairHeight, perRow, bestRow, bestOverlapRatio };
  });

  const summary: RowGeometrySummary = {
    rows,
    rawCount: consideredSources,
    rowPairOverlaps,
    midpointHits
  };
  return summary;
};

export interface PairOverlapResult {
  pair: MultiFieldPair;
  midpoint: number | null;
  pairWidth: number | null;
  perColumn: Record<LineItemColumnKey, { overlapWidth: number; overlapRatio: number; midpointInside: boolean }>;
  bestColumn?: LineItemColumnKey;
  bestOverlapRatio?: number;
}


export interface PredictionResult { column?: LineItemColumnKey; confidence: number; }

export interface RowPrediction { lineNumber?: number; score: number; }

export const average = (arr: number[]) => arr.reduce((a,b)=>a+b,0)/(arr.length || 1);

export interface CommitMappingParams {
  lineNumber: number;
  pairs: MultiFieldPair[];
  proposed: Record<string, LineItemColumnKey | ''>;
  purchaseOrder: PurchaseOrder;
  onUpdate: (po: PurchaseOrder) => void;
  onFieldSourceUpdate?: (fieldId: string, sourceIds: string[]) => void;
}

export const commitMapping = ({
  lineNumber,
  pairs,
  proposed,
  purchaseOrder,
  onUpdate,
  onFieldSourceUpdate
}: CommitMappingParams) => {
  const bucket: Record<LineItemColumnKey, { texts: string[]; boxIds: string[] }> = {
    sku: { texts: [], boxIds: [] },
    description: { texts: [], boxIds: [] },
    quantity: { texts: [], boxIds: [] },
    unitPrice: { texts: [], boxIds: [] }
  } as const;
  const recordedMappings: { pair: MultiFieldPair; column: LineItemColumnKey }[] = [];

  pairs.forEach(pair => {
    const col = proposed[pair.fieldId];
    if (!col) return;
    bucket[col].texts.push(pair.text);
    bucket[col].boxIds.push(pair.boxId);
    recordedMappings.push({ pair, column: col });
  });

  const updates: Partial<LineItem> = {};
  let existingItem = purchaseOrder.lineItems.find(li => li.lineNumber === lineNumber);
  const syntheticNew = !existingItem;
  if (syntheticNew) {
    existingItem = { lineNumber, sku: '', description: '', quantity: 0, unitPrice: 0 } as LineItem;
  }

  if (bucket.sku.texts.length) {
  const normalized = bucket.sku.texts.map(t => t.replace(/\s+/g,' ').trim()).filter(t => t.length);
  updates.sku = uniq(normalized).join(' ');
  }
  if (bucket.description.texts.length) {
    const base = '';
    const additions = bucket.description.texts;
    const combined = [base].filter(Boolean).concat(additions).join('\n');
    updates.description = combined;
  }
  if (bucket.quantity.texts.length) {
    let sum = 0; let any = false;
    bucket.quantity.texts.forEach(t => {
      const v = parseIntegerSafe(t);
      if (v != null) { sum += v; any = true; }
    });
    if (any) updates.quantity = sum;
  }
  if (bucket.unitPrice.texts.length) {
    const values: number[] = [];
    bucket.unitPrice.texts.forEach(t => {
      const v = parseDecimalSafe(t);
      if (v != null) values.push(v);
    });
    if (values.length === 1) updates.unitPrice = values[0];
    else if (values.length > 1) {
      const avg = values.reduce((a,b)=>a+b,0)/values.length;
      updates.unitPrice = avg;
    }
  }

  if (Object.keys(updates).length) {
    let updatedItems: LineItem[];
    if (syntheticNew) {
      updatedItems = [...purchaseOrder.lineItems, { ...(existingItem as LineItem), ...updates }].sort((a,b)=>a.lineNumber - b.lineNumber);
    } else {
      updatedItems = purchaseOrder.lineItems.map(it => it.lineNumber === lineNumber ? { ...it, ...updates } : it);
    }
    onUpdate({ ...purchaseOrder, lineItems: updatedItems });
  }

  if (onFieldSourceUpdate) {
    const updates: { fieldId: string; sourceIds: string[] }[] = [];
    (Object.keys(bucket) as LineItemColumnKey[]).forEach(col => {
      if (bucket[col].boxIds.length) {
        const uniqueIds: string[] = [];
        bucket[col].boxIds.forEach(id => { if (!uniqueIds.includes(id)) uniqueIds.push(id); });
  updates.push({ fieldId: makeLineItemField(lineNumber, col), sourceIds: uniqueIds });
      }
    });
    // If caller provided a batch-aware function they can intercept; we still call individually for backward compatibility
    updates.forEach(u => onFieldSourceUpdate!(u.fieldId, u.sourceIds));
  }

  // (rowCentersRef / rowSpansRef learning removed)
};

// predictRowForPair removed with row spatial learning elimination

export const ensureRowExists = (
  purchaseOrder: PurchaseOrder,
  onUpdate: (po: PurchaseOrder) => void,
  lineNumber: number
) => {
  if (purchaseOrder.lineItems.some(li => li.lineNumber === lineNumber)) return;
  const newItem: LineItem = { lineNumber, sku: '', description: '', quantity: 0, unitPrice: 0 };
  const items = [...purchaseOrder.lineItems, newItem].sort((a,b)=>a.lineNumber - b.lineNumber);
  onUpdate({ ...purchaseOrder, lineItems: items });
};

// Column-oriented commit: a fixed column mapped across potentially multiple rows.
export interface CommitColumnAssignmentsParams {
  column: LineItemColumnKey;
  assignments: { pair: MultiFieldPair; rowNumber: number }[];
  purchaseOrder: PurchaseOrder;
  onUpdate: (po: PurchaseOrder) => void;
  onFieldSourceUpdate?: (fieldId: string, sourceIds: string[]) => void;
}

export const commitColumnAssignments = ({
  column,
  assignments,
  purchaseOrder,
  onUpdate,
  onFieldSourceUpdate
}: CommitColumnAssignmentsParams) => {
  if (!assignments.length) return;

  // Group by row
  const byRow: Record<number, { texts: string[]; boxIds: string[] }> = {};
  assignments.forEach(a => {
    if (!byRow[a.rowNumber]) byRow[a.rowNumber] = { texts: [], boxIds: [] };
    byRow[a.rowNumber].texts.push(a.pair.text);
    byRow[a.rowNumber].boxIds.push(a.pair.boxId);
  });

  // Clone line items for batch update & create missing rows
  let items = [...purchaseOrder.lineItems];
  const existingLineNumbers = new Set(items.map(li => li.lineNumber));
  Object.keys(byRow).forEach(rowStr => {
    const ln = parseInt(rowStr,10);
    if (!existingLineNumbers.has(ln)) {
      items.push({ lineNumber: ln, sku: '', description: '', quantity: 0, unitPrice: 0 });
    }
  });
  items.sort((a,b)=>a.lineNumber - b.lineNumber);

  const updatedItems = items.map(li => {
    const bucket = byRow[li.lineNumber];
    if (!bucket) return li;
    const texts = bucket.texts.map(t => t.replace(/\s+/g,' ').trim()).filter(Boolean);
    if (!texts.length) return li;
    const updated: LineItem = { ...li };
    switch (column) {
      case 'sku': {
        updated.sku = uniq(texts).join(' ');
        break;
      }
      case 'description': {
        const base = '';
        const combined = [base].filter(Boolean).concat(texts).join('\n');
        updated.description = combined;
        break;
      }
      case 'quantity': {
        let sum = 0; let any = false;
        texts.forEach(t => { const v = parseIntegerSafe(t); if (v != null) { sum += v; any = true; } });
        if (any) updated.quantity = sum;
        break;
      }
      case 'unitPrice': {
        const values: number[] = [];
        texts.forEach(t => { const v = parseDecimalSafe(t); if (v != null) values.push(v); });
        if (values.length === 1) updated.unitPrice = values[0];
        else if (values.length > 1) updated.unitPrice = values.reduce((a,b)=>a+b,0)/values.length;
        break;
      }
    }
    return updated;
  });

  onUpdate({ ...purchaseOrder, lineItems: updatedItems });

  if (onFieldSourceUpdate) {
    const updates: { fieldId: string; sourceIds: string[] }[] = [];
    Object.entries(byRow).forEach(([rowStr, bucket]) => {
      const ln = parseInt(rowStr,10);
      const uniqueIds: string[] = [];
      bucket.boxIds.forEach(id => { if (!uniqueIds.includes(id)) uniqueIds.push(id); });
  updates.push({ fieldId: makeLineItemField(ln, column), sourceIds: uniqueIds });
    });
    updates.forEach(u => onFieldSourceUpdate!(u.fieldId, u.sourceIds));
  }
};
