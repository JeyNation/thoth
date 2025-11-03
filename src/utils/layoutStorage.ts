import type { LayoutMap } from '../types/extractionRules';

const STORAGE_KEY_PREFIX = 'thoth:layoutMap:';

const getStorageKey = (vendorId: string) => `${STORAGE_KEY_PREFIX}${vendorId}`;

export const readLayoutMapFromStorage = (vendorId: string): LayoutMap | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(vendorId));
    if (!raw) return null;
    return JSON.parse(raw) as LayoutMap;
  } catch (error) {
    console.warn('Failed to read layout map from localStorage', error);
    return null;
  }
};

export const writeLayoutMapToStorage = (vendorId: string, layoutMap: LayoutMap) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(vendorId), JSON.stringify(layoutMap));
  } catch (error) {
    console.warn('Failed to persist layout map to localStorage', error);
  }
};
