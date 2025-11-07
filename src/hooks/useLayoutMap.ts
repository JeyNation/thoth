"use client";

import { useCallback, useEffect, useState } from 'react';

import type { AnchorRule, LayoutMap, PositionConfig } from '../types/extractionRules';
import { readLayoutMapFromStorage, writeLayoutMapToStorage } from '../utils/layoutStorage';

function migrateStartingPosition(map: LayoutMap): LayoutMap {
  try {
    const next: LayoutMap = {
      ...map,
      fields: map.fields?.map(f => ({
        ...f,
        rules: f.rules?.map((r) => {
          if (r.ruleType !== 'anchor') return r;
          let rule = r as AnchorRule;
          const pos = (rule.positionConfig || {}) as Partial<PositionConfig>;

          // Clean up: remove direction property if it exists and ensure startingPosition
          let startingPosition = pos.startingPosition;
          if (!startingPosition) {
            // Use legacy 'direction' key (if present) to set default startingPosition, then remove direction
            const dir = String(((pos as unknown) as Record<string, unknown>).direction || '').toLowerCase();
            if (dir === 'right') startingPosition = 'topRight';
            else if (dir === 'bottom' || dir === 'below' || dir === '') startingPosition = 'bottomLeft';
            else if (dir === 'left') startingPosition = 'topLeft';
            else if (dir === 'top' || dir === 'above') startingPosition = 'topLeft';
            else startingPosition = 'bottomLeft'; // fallback
          }

          // Create new position config without direction property (legacy 'direction' key sanitized)
          const rawPos = pos as unknown as Record<string, unknown>;
          const cleanPosRecord: Record<string, unknown> = { ...rawPos };
          delete (cleanPosRecord as Record<string, unknown>)['direction'];
          rule = {
            ...rule,
            positionConfig: {
              // cast via unknown to acknowledge runtime migration from legacy shape
              ...(cleanPosRecord as unknown as PositionConfig),
              startingPosition
            }
          } as AnchorRule;

          return rule;
        }) || []
      })) || []
    };
    return next;
  } catch (e) {
    console.warn('migrateStartingPosition failed, returning original map', e);
    return map;
  }
}

export function useLayoutMap(vendorId?: string) {
  const [layoutMap, setLayoutMap] = useState<LayoutMap | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const stored = readLayoutMapFromStorage(vendorId);
      if (stored) {
        const migrated = migrateStartingPosition(stored);
        setLayoutMap(migrated);
        // Persist migration
        try { writeLayoutMapToStorage(vendorId, migrated); } catch {}
        return;
      }
      const res = await fetch(`/data/layout_maps/${vendorId}_rules.json?t=${Date.now()}`);
      if (res.ok) {
        const data: LayoutMap = await res.json();
        const migrated = migrateStartingPosition(data);
        setLayoutMap(migrated);
      } else {
        setLayoutMap(null);
      }
    } catch (e) {
      console.error('Failed to load layout map', e);
      setLayoutMap(null);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveLayoutMap = useCallback((next: LayoutMap) => {
    if (next.vendorId) {
      const migrated = migrateStartingPosition(next);
      writeLayoutMapToStorage(next.vendorId, migrated);
      setLayoutMap(migrated);
      return;
    }
    setLayoutMap(next);
  }, []);

  return { layoutMap, setLayoutMap, loading, refresh, saveLayoutMap } as const;
}
