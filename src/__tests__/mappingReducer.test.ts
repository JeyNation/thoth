import { describe, it, expect } from 'vitest';

// Local reimplementation mirroring provider reducer behavior for unit test isolation.
interface FieldSourceGeom { id: string; top: number; left: number; right: number; bottom: number; }
interface FieldSourceEntry { ids: string[]; boxes: FieldSourceGeom[]; }
type LocalFieldSources = Record<string, FieldSourceEntry>;
interface BoundingBoxPoint { x: number; y: number; }
interface BoundingBox { generatedId: string; points: BoundingBoxPoint[]; }
interface MappingState { fieldSources: LocalFieldSources; past: LocalFieldSources[]; future: LocalFieldSources[]; }
type Action =
  | { type: 'UPDATE_ONE'; fieldId: string; sourceIds: string[] | null; boundingBoxes?: BoundingBox[] }
  | { type: 'BATCH_UPDATE'; updates: { fieldId: string; sourceIds: string[] | null }[]; boundingBoxes?: BoundingBox[] }
  | { type: 'UNDO' } | { type: 'REDO' };

const computeGeometry = (ids: string[] | null | undefined, boxes?: BoundingBox[]): FieldSourceGeom[] => {
  if (!ids || !ids.length || !boxes) return [];
  return ids.map(id => {
    const bb = boxes.find(b => b.generatedId === id);
    if (!bb) return { id, top:0,left:0,right:0,bottom:0 };
    const xs = bb.points.map(p=>p.x); const ys = bb.points.map(p=>p.y);
    return { id, top: Math.min(...ys), left: Math.min(...xs), right: Math.max(...xs), bottom: Math.max(...ys) };
  });
};
const withUpdatedField = (prev: LocalFieldSources, fieldId: string, sourceIds: string[] | null, boxes?: BoundingBox[]): LocalFieldSources => {
  if (!sourceIds || !sourceIds.length) {
    const { [fieldId]: _removed, ...rest } = prev; return rest;
  }
  return { ...prev, [fieldId]: { ids: sourceIds, boxes: computeGeometry(sourceIds, boxes) } };
};
const reducer = (state: MappingState, action: Action): MappingState => {
  switch (action.type) {
    case 'UPDATE_ONE': {
      const next = withUpdatedField(state.fieldSources, action.fieldId, action.sourceIds, action.boundingBoxes);
      if (next === state.fieldSources) return state;
      return { fieldSources: next, past: [...state.past, state.fieldSources], future: [] };
    }
    case 'BATCH_UPDATE': {
      let working = state.fieldSources;
      action.updates.forEach(u => { working = withUpdatedField(working, u.fieldId, u.sourceIds, action.boundingBoxes); });
      if (working === state.fieldSources) return state;
      return { fieldSources: working, past: [...state.past, state.fieldSources], future: [] };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { fieldSources: prev, past: state.past.slice(0,-1), future: [state.fieldSources, ...state.future] };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { fieldSources: next, past: [...state.past, state.fieldSources], future: rest };
    }
    default: return state;
  }
};

const sampleBoxes: BoundingBox[] = [
  { generatedId: 'bbox-A-0', points: [{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}] },
  { generatedId: 'bbox-B-0', points: [{x:20,y:5},{x:30,y:5},{x:30,y:15},{x:20,y:15}] }
];

describe('mapping reducer', () => {
  it('updates single field and records history', () => {
    const s0: MappingState = { fieldSources: {}, past: [], future: [] };
    const s1 = reducer(s0, { type: 'UPDATE_ONE', fieldId: 'f1', sourceIds: ['bbox-A-0'], boundingBoxes: sampleBoxes });
    expect(Object.keys(s1.fieldSources)).toEqual(['f1']);
    expect(s1.past.length).toBe(1);
    expect(s1.fieldSources.f1.boxes[0]).toMatchObject({ id: 'bbox-A-0', left:0, top:0 });
  });

  it('batch updates multiple fields atomically', () => {
    const s0: MappingState = { fieldSources: {}, past: [], future: [] };
    const s1 = reducer(s0, { type: 'BATCH_UPDATE', updates: [
      { fieldId: 'f1', sourceIds: ['bbox-A-0'] },
      { fieldId: 'f2', sourceIds: ['bbox-B-0'] }
    ], boundingBoxes: sampleBoxes });
    expect(Object.keys(s1.fieldSources).sort()).toEqual(['f1', 'f2']);
    expect(s1.past.length).toBe(1);
  });

  it('undo and redo transitions', () => {
    let s: MappingState = { fieldSources: {}, past: [], future: [] };
    s = reducer(s, { type: 'UPDATE_ONE', fieldId: 'f1', sourceIds: ['bbox-A-0'], boundingBoxes: sampleBoxes });
    s = reducer(s, { type: 'UPDATE_ONE', fieldId: 'f2', sourceIds: ['bbox-B-0'], boundingBoxes: sampleBoxes });
    s = reducer(s, { type: 'UNDO' });
    expect(Object.keys(s.fieldSources)).toEqual(['f1']);
    s = reducer(s, { type: 'REDO' });
    expect(Object.keys(s.fieldSources).sort()).toEqual(['f1', 'f2']);
    // redo stack cleared after new change
    s = reducer(s, { type: 'UPDATE_ONE', fieldId: 'f3', sourceIds: ['bbox-A-0'], boundingBoxes: sampleBoxes });
    expect(s.future.length).toBe(0);
  });
});
