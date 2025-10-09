export function uniq<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) { if (!seen.has(v)) { seen.add(v); out.push(v); } }
  return out;
}
