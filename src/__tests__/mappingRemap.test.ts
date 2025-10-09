import { describe, it, expect } from 'vitest';
import { remapFieldSourcesForInsertion, applyMappingUpdates } from '../utils/mappingRemap';
import type { FieldSources } from '../types/mapping';

describe('remapFieldSourcesForInsertion', () => {
  it('clears old ids then adds new ids preserving sources', () => {
    const initial: FieldSources = {
      'lineItem-2-sku': { ids: ['a'], boxes: [] },
      'lineItem-2-description': { ids: ['b'], boxes: [] },
      'lineItem-3-sku': { ids: ['c'], boxes: [] }
    };
    const remapped = [
      { oldId: 'lineItem-2-sku', newId: 'lineItem-3-sku' },
      { oldId: 'lineItem-2-description', newId: 'lineItem-3-description' },
      { oldId: 'lineItem-3-sku', newId: 'lineItem-4-sku' }
    ];
    const { updates } = remapFieldSourcesForInsertion(initial, remapped);
    // First phase clears
    const clearPhase = updates.slice(0,3).map(u => u.sourceIds.length === 0).every(Boolean);
    expect(clearPhase).toBe(true);
    // Second phase adds
    const addPhase = updates.slice(3).every(u => u.sourceIds.length > 0);
    expect(addPhase).toBe(true);
    const final = applyMappingUpdates(initial, updates);
    expect(final['lineItem-3-sku'].ids).toEqual(['a']);
    expect(final['lineItem-3-description'].ids).toEqual(['b']);
    expect(final['lineItem-4-sku'].ids).toEqual(['c']);
    // Old ids removed
    expect(final['lineItem-2-sku']).toBeUndefined();
    expect(final['lineItem-2-description']).toBeUndefined();
  });
});
