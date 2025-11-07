import { makeLineItemField, parseLineItemField } from '../types/fieldIds';
import type { PurchaseOrder, LineItem } from '../types/PurchaseOrder';

export interface RemoveLineItemResult {
  purchaseOrder: PurchaseOrder;
  removedFieldIds: string[]; // mapping field ids belonging to removed line
  remappedFieldIds: { oldId: string; newId: string }[]; // shifted lines after compaction
}

export const addBlankLineItem = (po: PurchaseOrder, explicitLineNumber?: number): PurchaseOrder => {
  const nextLineNumber = explicitLineNumber ?? computeNextLineNumber(po);
  if (po.lineItems.some(li => li.lineNumber === nextLineNumber)) return po; // already exists
  const newItem: LineItem = { lineNumber: nextLineNumber, sku: '', description: '', quantity: 0, unitPrice: 0 };
  return { ...po, lineItems: [...po.lineItems, newItem].sort((a,b)=>a.lineNumber - b.lineNumber) };
};

export const removeLineItem = (po: PurchaseOrder, lineNumber: number): RemoveLineItemResult => {
  if (!po.lineItems.some(li => li.lineNumber === lineNumber)) {
    return { purchaseOrder: po, removedFieldIds: [], remappedFieldIds: [] };
  }
  const columns = ['sku','description','quantity','unitPrice'] as const;
  const removedFieldIds: string[] = columns.map(col => makeLineItemField(lineNumber, col));
  const remappedFieldIds: { oldId: string; newId: string }[] = [];
  const nextItems: LineItem[] = po.lineItems
    .filter(li => li.lineNumber !== lineNumber)
    .map(li => {
      if (li.lineNumber > lineNumber) {
        const oldLine = li.lineNumber;
        const updated: LineItem = { ...li, lineNumber: oldLine - 1 };
        columns.forEach(col => {
          remappedFieldIds.push({ oldId: makeLineItemField(oldLine, col), newId: makeLineItemField(oldLine - 1, col) });
        });
        return updated;
      }
      return li;
    })
    .sort((a,b)=>a.lineNumber - b.lineNumber);
  return { purchaseOrder: { ...po, lineItems: nextItems }, removedFieldIds, remappedFieldIds };
};

export const computeNextLineNumber = (po: PurchaseOrder): number => {
  const nums = po.lineItems.map(li => li.lineNumber).sort((a,b)=>a-b);
  let expected = 1;
  for (const n of nums) { if (n > expected) return expected; if (n === expected) expected++; }
  return expected;
};

export const ensureLineNumberExists = (po: PurchaseOrder, lineNumber: number): PurchaseOrder => {
  return po.lineItems.some(li => li.lineNumber === lineNumber) ? po : addBlankLineItem(po, lineNumber);
};

// Insert a blank line item immediately after the given lineNumber, shifting subsequent line numbers upward by 1.
// Returns the updated purchase order plus a mapping of old field ids to new field ids for all shifted line items.
export interface InsertLineItemResult {
  purchaseOrder: PurchaseOrder;
  remappedFieldIds: { oldId: string; newId: string }[];
  newLineNumber: number; // the line number of the inserted blank row
}

export const insertBlankLineItem = (po: PurchaseOrder, afterLineNumber: number): InsertLineItemResult => {
  // Determine new line number to insert (after given)
  const newLineNumber = afterLineNumber + 1;
  // First, shift any existing items with lineNumber >= newLineNumber upward by 1 to make room.
  // Collect remapped field ids for each shifted line item and each column.
  const remappedFieldIds: { oldId: string; newId: string }[] = [];
  const columns = ['sku','description','quantity','unitPrice'] as const;
  const shiftedItems: LineItem[] = po.lineItems.map(li => {
    if (li.lineNumber >= newLineNumber) {
      const oldLine = li.lineNumber;
      const updated: LineItem = { ...li, lineNumber: oldLine + 1 };
      columns.forEach(col => {
        remappedFieldIds.push({ oldId: makeLineItemField(oldLine, col), newId: makeLineItemField(oldLine + 1, col) });
      });
      return updated;
    }
    return li;
  });

  // If there was already a gap at newLineNumber and no items needed shifting, ensure we aren't duplicating an existing line
  const lineExists = po.lineItems.some(li => li.lineNumber === newLineNumber);
  if (lineExists) {
    // After shifting, that existing line is now +1, so we are free to insert.
  }

  const blank: LineItem = { lineNumber: newLineNumber, sku: '', description: '', quantity: 0, unitPrice: 0 };
  const updatedItems = [...shiftedItems, blank].sort((a,b)=>a.lineNumber - b.lineNumber);
  return { purchaseOrder: { ...po, lineItems: updatedItems }, remappedFieldIds, newLineNumber };
};

// Dev-only invariant checks
export interface InvariantIssue { type: string; message: string; fieldId?: string; lineNumber?: number; }

export const checkPurchaseOrderInvariants = (po: PurchaseOrder, fieldSourceIds: string[]): InvariantIssue[] => {
  const issues: InvariantIssue[] = [];
  // Unique line numbers
  const nums = po.lineItems.map(li => li.lineNumber);
  const seen = new Set<number>();
  nums.forEach(n => { if (seen.has(n)) issues.push({ type: 'DUP_LINE', message: `Duplicate line number ${n}`, lineNumber: n }); else seen.add(n); });

  // Mapping field ids reference existing line numbers
  fieldSourceIds.forEach(fid => {
    const parsed = parseLineItemField(fid);
    if (parsed && !po.lineItems.some(li => li.lineNumber === parsed.lineNumber)) {
      issues.push({ type: 'ORPHAN_FIELD', message: `FieldId ${fid} references missing line ${parsed.lineNumber}`, fieldId: fid, lineNumber: parsed.lineNumber });
    }
  });

  return issues;
};
