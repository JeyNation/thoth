// Central utilities for numeric parsing / normalization

export const parseIntegerSafe = (raw: string): number | null => {
  const cleaned = raw.replace(/[^0-9-]/g, '');
  if (!cleaned) return null;
  const v = parseInt(cleaned, 10);
  return Number.isNaN(v) ? null : v;
};

export const parseDecimalSafe = (raw: string): number | null => {
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.' ) return null;
  const v = parseFloat(cleaned);
  return Number.isNaN(v) ? null : v;
};
