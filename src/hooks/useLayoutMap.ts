"use client";

import { useCallback, useEffect, useState } from 'react';
import type { LayoutMap } from '../types/extractionRules';
import { readLayoutMapFromStorage, writeLayoutMapToStorage } from '../utils/layoutStorage';

export function useLayoutMap(vendorId?: string) {
  const [layoutMap, setLayoutMap] = useState<LayoutMap | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const stored = readLayoutMapFromStorage(vendorId);
      if (stored) {
        setLayoutMap(stored);
        return;
      }
      const res = await fetch(`/data/layout_maps/${vendorId}_rules.json?t=${Date.now()}`);
      if (res.ok) {
        const data: LayoutMap = await res.json();
        setLayoutMap(data);
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
      writeLayoutMapToStorage(next.vendorId, next);
    }
    setLayoutMap(next);
  }, []);

  return { layoutMap, setLayoutMap, loading, refresh, saveLayoutMap } as const;
}
