import type { FieldSources } from '../types/mapping';

export interface RemappedIdPair { oldId: string; newId: string; }
export interface RemapResult { updates: { fieldId: string; sourceIds: string[] }[]; }

// Generates ordered mapping updates for an insertion remap.
// Strategy: capture source ids from original fieldSources snapshot, then
// 1. Clear all old ids first.
// 2. Add all new ids with captured sources.
// This avoids intermediate collisions (e.g., newId of one shift equals oldId of another).
export const remapFieldSourcesForInsertion = (fieldSources: FieldSources, remapped: RemappedIdPair[]): RemapResult => {
  if (!remapped.length) return { updates: [] };
  const captured = remapped.map(p => ({ ...p, entry: fieldSources[p.oldId] }));
  const updates: { fieldId: string; sourceIds: string[] }[] = [];
  // Clear phase
  captured.forEach(c => { if (c.entry) updates.push({ fieldId: c.oldId, sourceIds: [] }); });
  // Add phase
  captured.forEach(c => { if (c.entry) updates.push({ fieldId: c.newId, sourceIds: c.entry.ids }); });
  return { updates };
};

// Helper for tests: apply updates sequentially similar to reducer logic
export const applyMappingUpdates = (initial: FieldSources, updates: { fieldId: string; sourceIds: string[] }[]): FieldSources => {
  let working: FieldSources = { ...initial };
  updates.forEach(u => {
    if (!u.sourceIds.length) {
      if (u.fieldId in working) {
        const { [u.fieldId]: _removed, ...rest } = working;
        working = rest;
      }
    } else {
      working = { ...working, [u.fieldId]: { ids: u.sourceIds, boxes: working[u.fieldId]?.boxes || [] } };
    }
  });
  return working;
};
