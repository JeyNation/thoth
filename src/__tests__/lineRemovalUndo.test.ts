import { describe, it, expect } from 'vitest';
import type { PurchaseOrder } from '../types/PurchaseOrder';
import type { FieldSources } from '../types/mapping';
import { parseLineItemField } from '../types/fieldIds';

// Minimal reproduction of APPLY_TRANSACTION orphan purge logic from reducer
interface Snapshot { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; }
interface State { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; past: Snapshot[]; future: Snapshot[]; }

const snapshot = (s: State): Snapshot => ({ fieldSources: s.fieldSources, purchaseOrder: s.purchaseOrder });

const applyTransaction = (state: State, mappingUpdates: { fieldId: string; sourceIds: string[] | null }[], purchaseOrder: PurchaseOrder): State => {
  let working = { ...state.fieldSources } as FieldSources;
  mappingUpdates.forEach(u => {
    if (!u.sourceIds || u.sourceIds.length === 0) {
      const { [u.fieldId]: _removed, ...rest } = working; working = rest; return;
    }
    working = { ...working, [u.fieldId]: { ids: u.sourceIds, boxes: [] } };
  });
  // purge orphans
  const valid = new Set(purchaseOrder.lineItems.map(li => li.lineNumber));
  let changed = false;
  const pruned: FieldSources = {};
  Object.entries(working).forEach(([fid, entry]) => {
    const parsed = parseLineItemField(fid);
    if (parsed && !valid.has(parsed.lineNumber)) { changed = true; return; }
    pruned[fid] = entry;
  });
  if (changed) working = pruned;
  if (working === state.fieldSources && purchaseOrder === state.purchaseOrder) return state;
  return { fieldSources: working, purchaseOrder, past: [...state.past, snapshot(state)], future: [] };
};

describe('line removal undo integration', () => {
  it('removing a line purges related mappings and undo restores them', () => {
    // Initial state with two lines and mappings for both
    let state: State = {
      fieldSources: {
        'lineItem-1-sku': { ids: ['a1'], boxes: [] },
        'lineItem-2-sku': { ids: ['b1'], boxes: [] },
        'documentNumber': { ids: ['d1'], boxes: [] }
      },
      purchaseOrder: { documentNumber: '', customerNumber: '', shipToAddress: '', lineItems: [
        { lineNumber: 1, sku: 'A', description: '', quantity: 0, unitPrice: 0 },
        { lineNumber: 2, sku: 'B', description: '', quantity: 0, unitPrice: 0 }
      ] },
      past: [],
      future: []
    };

    // Remove line 2 (simulate transaction: updated PO without line 2, no explicit mappingUpdates -> orphan purge should remove mapping for lineItem-2-sku)
    const poAfterRemoval: PurchaseOrder = { ...state.purchaseOrder, lineItems: state.purchaseOrder.lineItems.filter(li => li.lineNumber !== 2) };
    state = applyTransaction(state, [], poAfterRemoval);
    expect(Object.keys(state.fieldSources).sort()).toEqual(['documentNumber','lineItem-1-sku']);

    // Undo (manually emulate): restore snapshot
    const previous = state.past[state.past.length - 1];
    const restored: State = { fieldSources: previous.fieldSources, purchaseOrder: previous.purchaseOrder, past: state.past.slice(0,-1), future: [snapshot(state)] };
    expect(Object.keys(restored.fieldSources).sort()).toEqual(['documentNumber','lineItem-1-sku','lineItem-2-sku']);
    expect(restored.purchaseOrder.lineItems.length).toBe(2);
  });
});
