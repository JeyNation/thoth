import { describe, it, expect } from 'vitest';

// Local facsimile of MappingContext reducer including purchaseOrder + transactions
interface LineItem { lineNumber: number; sku: string; description: string; quantity: number; unitPrice: number; }
interface PurchaseOrder { documentNumber: string; customerNumber: string; shipToAddress: string; lineItems: LineItem[]; }
interface FieldSourceGeom { id: string; top: number; left: number; right: number; bottom: number; }
interface FieldSourceEntry { ids: string[]; boxes: FieldSourceGeom[]; }
type FieldSources = Record<string, FieldSourceEntry>;
interface BoundingBoxPoint { X: number; Y: number; }
interface BoundingBox { generatedId: string; Points: BoundingBoxPoint[]; }
interface HistorySnapshot { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; }
interface State { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; past: HistorySnapshot[]; future: HistorySnapshot[]; boundingBoxes: BoundingBox[]; }

type Action =
  | { type: 'UPDATE_ONE'; fieldId: string; sourceIds: string[] | null; boundingBoxes?: BoundingBox[] }
  | { type: 'BATCH_UPDATE'; updates: { fieldId: string; sourceIds: string[] | null }[]; boundingBoxes?: BoundingBox[] }
  | { type: 'SET_PO'; purchaseOrder: PurchaseOrder }
  | { type: 'APPLY_TRANSACTION'; mappingUpdates: { fieldId: string; sourceIds: string[] | null }[]; purchaseOrder: PurchaseOrder; boundingBoxes?: BoundingBox[] }
  | { type: 'UNDO' } | { type: 'REDO' };

const snapshot = (s: State): HistorySnapshot => ({ fieldSources: s.fieldSources, purchaseOrder: s.purchaseOrder });

const computeGeometry = (ids: string[] | null | undefined, boxes?: BoundingBox[]): FieldSourceGeom[] => {
  if (!ids || !ids.length || !boxes) return [];
  return ids.map(id => {
    const bb = boxes.find(b => b.generatedId === id);
    if (!bb) return { id, top:0,left:0,right:0,bottom:0 };
    const xs = bb.Points.map(p=>p.X); const ys = bb.Points.map(p=>p.Y);
    return { id, top: Math.min(...ys), left: Math.min(...xs), right: Math.max(...xs), bottom: Math.max(...ys) };
  });
};
const withUpdatedField = (prev: FieldSources, fieldId: string, sourceIds: string[] | null, boxes?: BoundingBox[]): FieldSources => {
  if (!sourceIds || !sourceIds.length) {
    if (!(fieldId in prev)) return prev;
    const { [fieldId]: _removed, ...rest } = prev; return rest;
  }
  return { ...prev, [fieldId]: { ids: sourceIds, boxes: computeGeometry(sourceIds, boxes) } };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'UPDATE_ONE': {
      const next = withUpdatedField(state.fieldSources, action.fieldId, action.sourceIds, action.boundingBoxes || state.boundingBoxes);
      if (next === state.fieldSources) return state;
      return { ...state, fieldSources: next, past: [...state.past, snapshot(state)], future: [] };
    }
    case 'BATCH_UPDATE': {
      let working = state.fieldSources;
      action.updates.forEach(u => { working = withUpdatedField(working, u.fieldId, u.sourceIds, action.boundingBoxes || state.boundingBoxes); });
      if (working === state.fieldSources) return state;
      return { ...state, fieldSources: working, past: [...state.past, snapshot(state)], future: [] };
    }
    case 'SET_PO': {
      if (action.purchaseOrder === state.purchaseOrder) return state;
      return { ...state, purchaseOrder: action.purchaseOrder, past: [...state.past, snapshot(state)], future: [] };
    }
    case 'APPLY_TRANSACTION': {
      let working = state.fieldSources;
      action.mappingUpdates.forEach(u => { working = withUpdatedField(working, u.fieldId, u.sourceIds, action.boundingBoxes || state.boundingBoxes); });
      if (working === state.fieldSources && action.purchaseOrder === state.purchaseOrder) return state;
      return { ...state, fieldSources: working, purchaseOrder: action.purchaseOrder, past: [...state.past, snapshot(state)], future: [], boundingBoxes: action.boundingBoxes || state.boundingBoxes };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { ...state, fieldSources: prev.fieldSources, purchaseOrder: prev.purchaseOrder, past: state.past.slice(0,-1), future: [snapshot(state), ...state.future] };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { ...state, fieldSources: next.fieldSources, purchaseOrder: next.purchaseOrder, past: [...state.past, snapshot(state)], future: rest };
    }
    default: return state;
  }
};

const initPO = (): PurchaseOrder => ({ documentNumber: '', customerNumber: '', shipToAddress: '', lineItems: [] });

describe('undo/redo with transactions', () => {
  it('APPLY_TRANSACTION combines mapping + PO change into one snapshot', () => {
    let s: State = { fieldSources: {}, purchaseOrder: initPO(), past: [], future: [], boundingBoxes: [] };
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [ { fieldId: 'documentNumber', sourceIds: ['box-1'] } ], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'PO-1' } });
    expect(s.past.length).toBe(1);
    expect(s.fieldSources.documentNumber.ids).toEqual(['box-1']);
    expect(s.purchaseOrder.documentNumber).toBe('PO-1');
    s = reducer(s, { type: 'UNDO' });
    expect(s.purchaseOrder.documentNumber).toBe('');
    expect(s.fieldSources.documentNumber).toBeUndefined();
  });

  it('multiple mapping updates in a single APPLY_TRANSACTION undo together', () => {
    let s: State = { fieldSources: {}, purchaseOrder: initPO(), past: [], future: [], boundingBoxes: [] };
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [
      { fieldId: 'documentNumber', sourceIds: ['box-a'] },
      { fieldId: 'customerNumber', sourceIds: ['box-b'] }
    ], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'PO-X', customerNumber: 'CUST-X' } });
    expect(Object.keys(s.fieldSources).sort()).toEqual(['customerNumber','documentNumber']);
    s = reducer(s, { type: 'UNDO' });
    expect(s.fieldSources.documentNumber).toBeUndefined();
    expect(s.purchaseOrder.customerNumber).toBe('');
  });

  it('redo restores combined transaction after undo', () => {
    let s: State = { fieldSources: {}, purchaseOrder: initPO(), past: [], future: [], boundingBoxes: [] };
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [ { fieldId: 'documentNumber', sourceIds: ['box-1'] } ], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'PO-1' } });
    s = reducer(s, { type: 'UNDO' });
    s = reducer(s, { type: 'REDO' });
    expect(s.purchaseOrder.documentNumber).toBe('PO-1');
    expect(s.fieldSources.documentNumber.ids).toEqual(['box-1']);
  });

  it('redo stack cleared after new APPLY_TRANSACTION post-undo', () => {
    let s: State = { fieldSources: {}, purchaseOrder: initPO(), past: [], future: [], boundingBoxes: [] };
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'ONE' } });
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'TWO' } });
    s = reducer(s, { type: 'UNDO' }); // back to ONE
    expect(s.purchaseOrder.documentNumber).toBe('ONE');
    s = reducer(s, { type: 'APPLY_TRANSACTION', mappingUpdates: [], purchaseOrder: { ...s.purchaseOrder, documentNumber: 'THREE' } });
    expect(s.future.length).toBe(0);
    expect(s.purchaseOrder.documentNumber).toBe('THREE');
  });
});
