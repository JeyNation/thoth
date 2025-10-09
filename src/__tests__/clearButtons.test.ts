import { describe, it, expect } from 'vitest';

// We test clear logic indirectly by simulating the atomic transaction semantics used in Form:
// If a basic field is set to '' (explicit clear) then a mapping update removing that field's sources
// should be included in the APPLY_TRANSACTION payload.

interface PurchaseOrder { documentNumber: string; customerNumber: string; shipToAddress: string; lineItems: any[]; }
interface FieldSourceEntry { ids: string[]; boxes: any[]; }
interface FieldSources { [k: string]: FieldSourceEntry; }
interface HistorySnapshot { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; }
interface State { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; past: HistorySnapshot[]; future: HistorySnapshot[]; }

type Action = { type: 'APPLY_TRANSACTION'; mappingUpdates: { fieldId: string; sourceIds: string[] | null }[]; purchaseOrder: PurchaseOrder }
  | { type: 'UNDO' } | { type: 'REDO' };

const snapshot = (s: State): HistorySnapshot => ({ fieldSources: s.fieldSources, purchaseOrder: s.purchaseOrder });

const withUpdate = (prev: FieldSources, fieldId: string, sourceIds: string[] | null): FieldSources => {
  if (!sourceIds || !sourceIds.length) {
    if (!(fieldId in prev)) return prev; const { [fieldId]: _removed, ...rest } = prev; return rest;
  }
  return { ...prev, [fieldId]: { ids: sourceIds, boxes: [] } };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'APPLY_TRANSACTION': {
      let working = state.fieldSources;
      action.mappingUpdates.forEach(mu => { working = withUpdate(working, mu.fieldId, mu.sourceIds); });
      if (working === state.fieldSources && action.purchaseOrder === state.purchaseOrder) return state;
      return { fieldSources: working, purchaseOrder: action.purchaseOrder, past: [...state.past, snapshot(state)], future: [] };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { fieldSources: prev.fieldSources, purchaseOrder: prev.purchaseOrder, past: state.past.slice(0,-1), future: [snapshot(state), ...state.future] };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { fieldSources: next.fieldSources, purchaseOrder: next.purchaseOrder, past: [...state.past, snapshot(state)], future: rest };
    }
    default: return state;
  }
};

const initState = (): State => ({ fieldSources: {}, purchaseOrder: { documentNumber: '', customerNumber: '', shipToAddress: '', lineItems: [] }, past: [], future: [] });

describe('clear buttons logic', () => {
  it('clicking clear should clear value (documentNumber) and remove link mapping', () => {
    let s = initState();
    // First apply transaction simulating a mapped value
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [ { fieldId: 'documentNumber', sourceIds: ['box-1'] } ], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'PO-123' } });
    expect(s.purchaseOrder.documentNumber).toBe('PO-123');
    expect(s.fieldSources.documentNumber.ids).toEqual(['box-1']);

    // Simulate clear button: value set to '' and mapping update removing field sources
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [ { fieldId: 'documentNumber', sourceIds: [] } ], purchaseOrder: { ...s.purchaseOrder, documentNumber: '' } });
    expect(s.purchaseOrder.documentNumber).toBe('');
    expect(s.fieldSources.documentNumber).toBeUndefined();
  });

  it('clearing numeric field resets to 0 and removes mapping', () => {
    let s = initState();
    // simulate line item quantity mapping (field id pattern from real code: lineItem-<n>-<field>)
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [ { fieldId: 'lineItem-1-quantity', sourceIds: ['box-q'] } ], purchaseOrder: { ...s.purchaseOrder, lineItems: [{ lineNumber:1, sku:'', description:'', quantity: 5, unitPrice: 0 }] } });
    expect(s.fieldSources['lineItem-1-quantity'].ids).toEqual(['box-q']);
    // clear (quantity -> 0 and mapping removed)
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [ { fieldId: 'lineItem-1-quantity', sourceIds: [] } ], purchaseOrder: { ...s.purchaseOrder, lineItems: [{ lineNumber:1, sku:'', description:'', quantity: 0, unitPrice: 0 }] } });
    expect(s.purchaseOrder.lineItems[0].quantity).toBe(0);
    expect(s.fieldSources['lineItem-1-quantity']).toBeUndefined();
  });
});
