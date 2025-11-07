'use client';

import React, { createContext, useContext, useMemo, useCallback, useReducer } from 'react';

import { parseLineItemField } from '../types/fieldIds';
import type { FieldSources, ReverseFieldSourceIndex, BoundingBox, FieldSourceGeom } from '../types/mapping';
import type { PurchaseOrder } from '../types/PurchaseOrder';
import { checkPurchaseOrderInvariants } from '../utils/purchaseOrderMutations';

// ------------------------------
// State / Reducer for Undo/Redo
// ------------------------------
interface HistorySnapshot { fieldSources: FieldSources; purchaseOrder: PurchaseOrder; }
interface MappingState {
  fieldSources: FieldSources;
  purchaseOrder: PurchaseOrder;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  boundingBoxes: BoundingBox[]; // last known boxes for geometry fallback
}

type MappingAction =
  | { type: 'UPDATE_ONE'; fieldId: string; sourceIds: string[] | null; boundingBoxes?: BoundingBox[] }
  | { type: 'BATCH_UPDATE'; updates: { fieldId: string; sourceIds: string[] | null }[]; boundingBoxes?: BoundingBox[] }
  | { type: 'REPLACE_ALL'; next: FieldSources }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RECOMPUTE_GEOMETRY'; boundingBoxes?: BoundingBox[] }
  | { type: 'SET_PO'; purchaseOrder: PurchaseOrder }
  | { type: 'APPLY_TRANSACTION'; mappingUpdates: { fieldId: string; sourceIds: string[] | null }[]; purchaseOrder: PurchaseOrder; boundingBoxes?: BoundingBox[] };

const computeGeometry = (ids: string[] | null | undefined, boundingBoxes?: BoundingBox[]): FieldSourceGeom[] => {
  if (!ids || !ids.length || !boundingBoxes) return [];
  const out: FieldSourceGeom[] = [];
  ids.forEach(id => {
    const bb = boundingBoxes.find(b => b.id === id);
    if (bb && bb.points?.length) {
      const xs = bb.points.map(p => p.x); const ys = bb.points.map(p => p.y);
      out.push({ id, top: Math.min(...ys), left: Math.min(...xs), right: Math.max(...xs), bottom: Math.max(...ys) });
    }
  });
  return out;
};

const withUpdatedField = (prev: FieldSources, fieldId: string, sourceIds: string[] | null, boundingBoxes?: BoundingBox[]): FieldSources => {
  if (!sourceIds || sourceIds.length === 0) {
    if (!(fieldId in prev)) return prev; // nothing to remove
    const { [fieldId]: _removed, ...rest } = prev;
    return rest;
  }
  return {
    ...prev,
    [fieldId]: {
      ids: sourceIds,
      boxes: computeGeometry(sourceIds, boundingBoxes)
    }
  };
};

const snapshot = (state: MappingState): HistorySnapshot => ({ fieldSources: state.fieldSources, purchaseOrder: state.purchaseOrder });

const reducer = (state: MappingState, action: MappingAction): MappingState => {
  switch (action.type) {
    case 'UPDATE_ONE': {
      const nextFieldSources = withUpdatedField(state.fieldSources, action.fieldId, action.sourceIds, action.boundingBoxes || state.boundingBoxes);
      if (nextFieldSources === state.fieldSources) return state; // no change
      return { fieldSources: nextFieldSources, purchaseOrder: state.purchaseOrder, past: [...state.past, snapshot(state)], future: [], boundingBoxes: state.boundingBoxes };
    }
    case 'BATCH_UPDATE': {
      let working: FieldSources = state.fieldSources;
      action.updates.forEach(u => {
        working = withUpdatedField(working, u.fieldId, u.sourceIds, action.boundingBoxes || state.boundingBoxes);
      });
      if (working === state.fieldSources) return state;
      return { fieldSources: working, purchaseOrder: state.purchaseOrder, past: [...state.past, snapshot(state)], future: [], boundingBoxes: state.boundingBoxes };
    }
    case 'REPLACE_ALL': {
      return { fieldSources: action.next, purchaseOrder: state.purchaseOrder, past: [...state.past, snapshot(state)], future: [], boundingBoxes: state.boundingBoxes };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return { fieldSources: previous.fieldSources, purchaseOrder: previous.purchaseOrder, past: newPast, future: [snapshot(state), ...state.future], boundingBoxes: state.boundingBoxes };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { fieldSources: next.fieldSources, purchaseOrder: next.purchaseOrder, past: [...state.past, snapshot(state)], future: rest, boundingBoxes: state.boundingBoxes };
    }
    case 'RECOMPUTE_GEOMETRY': {
      if (!action.boundingBoxes) return state;
      const next: FieldSources = {};
      Object.entries(state.fieldSources).forEach(([fid, entry]) => {
        next[fid] = { ids: entry.ids, boxes: computeGeometry(entry.ids, action.boundingBoxes) };
      });
      return { ...state, fieldSources: next, boundingBoxes: action.boundingBoxes };
    }
    case 'SET_PO': {
      if (action.purchaseOrder === state.purchaseOrder) return state;
      return { fieldSources: state.fieldSources, purchaseOrder: action.purchaseOrder, past: [...state.past, snapshot(state)], future: [], boundingBoxes: state.boundingBoxes };
    }
    case 'APPLY_TRANSACTION': {
      let working: FieldSources = state.fieldSources;
      action.mappingUpdates.forEach(u => { working = withUpdatedField(working, u.fieldId, u.sourceIds, action.boundingBoxes || state.boundingBoxes); });
      if (working === state.fieldSources && action.purchaseOrder === state.purchaseOrder) return state; // no change
      // Auto-purge orphan mappings (line items removed) BEFORE snapshot
      const validLineNumbers = new Set(action.purchaseOrder.lineItems.map(li => li.lineNumber));
      let purged = false;
      const pruned: FieldSources = {};
      Object.entries(working).forEach(([fid, entry]) => {
        const parsed = parseLineItemField(fid);
        if (parsed && !validLineNumbers.has(parsed.lineNumber)) {
          purged = true; return;
        }
        pruned[fid] = entry;
      });
      if (purged) working = pruned;
      const next: MappingState = { fieldSources: working, purchaseOrder: action.purchaseOrder, past: [...state.past, snapshot(state)], future: [], boundingBoxes: action.boundingBoxes || state.boundingBoxes };
      if (process.env.NODE_ENV === 'development') {
        const fieldIds = Object.keys(next.fieldSources);
        const issues = checkPurchaseOrderInvariants(next.purchaseOrder, fieldIds);
        if (issues.length) {
          // eslint-disable-next-line no-console
            console.warn('[Invariant]', issues);
        }
      }
      return next;
    }
    default:
      return state;
  }
};

interface MappingContextValue {
  fieldSources: FieldSources;
  purchaseOrder: PurchaseOrder;
  reverseIndex: ReverseFieldSourceIndex;
  updateFieldSources: (fieldId: string, sourceIds: string[] | null, boundingBoxes?: BoundingBox[]) => void;
  batchUpdate: (updates: { fieldId: string; sourceIds: string[] | null }[], boundingBoxes?: BoundingBox[]) => void;
  applyTransaction: (payload: { mappingUpdates: { fieldId: string; sourceIds: string[] | null }[]; purchaseOrder: PurchaseOrder; boundingBoxes?: BoundingBox[] }) => void;
  updatePurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  replaceAll: (next: FieldSources) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  recomputeGeometry: (boundingBoxes?: BoundingBox[]) => void;
}

const MappingContext = createContext<MappingContextValue | undefined>(undefined);

export const MappingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialPO: PurchaseOrder = { documentNumber: '', customerNumber: '', documentDate: '', shipToAddress: '', lineItems: [] };
  const [state, dispatch] = useReducer(reducer, { fieldSources: {}, purchaseOrder: initialPO, past: [], future: [], boundingBoxes: [] } as MappingState);
  const fieldSources = state.fieldSources;
  const purchaseOrder = state.purchaseOrder;

  const reverseIndex: ReverseFieldSourceIndex = useMemo(() => {
    const idx: ReverseFieldSourceIndex = {};
    Object.entries(fieldSources).forEach(([fid, entry]) => {
      entry.ids.forEach(bid => { if (!idx[bid]) idx[bid] = [fid]; else idx[bid].push(fid); });
    });
    return idx;
  }, [fieldSources]);

  const updateFieldSources = useCallback((fieldId: string, sourceIds: string[] | null, boundingBoxes?: BoundingBox[]) => {
    dispatch({ type: 'UPDATE_ONE', fieldId, sourceIds, boundingBoxes });
  }, []);

  const batchUpdate = useCallback((updates: { fieldId: string; sourceIds: string[] | null }[], boundingBoxes?: BoundingBox[]) => {
    dispatch({ type: 'BATCH_UPDATE', updates, boundingBoxes });
  }, []);

  const applyTransaction = useCallback((payload: { mappingUpdates: { fieldId: string; sourceIds: string[] | null }[]; purchaseOrder: PurchaseOrder; boundingBoxes?: BoundingBox[] }) => {
    dispatch({ type: 'APPLY_TRANSACTION', ...payload });
  }, []);

  const updatePurchaseOrder = useCallback((po: PurchaseOrder) => dispatch({ type: 'SET_PO', purchaseOrder: po }), []);

  const replaceAll = useCallback((next: FieldSources) => dispatch({ type: 'REPLACE_ALL', next }), []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const recomputeGeometry = useCallback((boundingBoxes?: BoundingBox[]) => dispatch({ type: 'RECOMPUTE_GEOMETRY', boundingBoxes }), []);

  const value: MappingContextValue = {
    fieldSources,
    purchaseOrder,
    reverseIndex,
    updateFieldSources,
    batchUpdate,
    applyTransaction,
    updatePurchaseOrder,
    replaceAll,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    recomputeGeometry
  };
  return <MappingContext.Provider value={value}>{children}</MappingContext.Provider>;
};

export const useMapping = (): MappingContextValue => {
  const ctx = useContext(MappingContext);
  if (!ctx) throw new Error('useMapping must be used within a MappingProvider');
  return ctx;
};
