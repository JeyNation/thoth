import type { LineItem } from './PurchaseOrder';

// Centralized definition of line item column keys (excluding lineNumber)
export const LINE_ITEM_COLUMNS = ['sku','description','quantity','unitPrice'] as const;
export type LineItemColumnTuple = typeof LINE_ITEM_COLUMNS;
export type LineItemColumnKey = LineItemColumnTuple[number];

// Helper: runtime type guard
export const isLineItemColumnKey = (val: unknown): val is LineItemColumnKey => {
  return typeof val === 'string' && (LINE_ITEM_COLUMNS as readonly string[]).includes(val);
};

// Heuristic: treat short, vowel-light lowercase tokens as abbreviations and uppercase them.
// Examples that become all caps: sku, uom, id, po, qty (if introduced later).
const isAbbreviation = (token: string): boolean => {
  const plain = token.replace(/[^a-z]/g, '');
  if (!plain) return false;
  // Only consider if originally all lowercase (no camel capitals yet) and length 2-5.
  if (token !== token.toLowerCase()) return false;
  if (plain.length < 2 || plain.length > 5) return false;
  // Count vowels; abbreviation if very few vowels (<=1) OR in a known short list.
  const vowels = (plain.match(/[aeiou]/g) || []).length;
  if (vowels <= 1) return true;
  if ([ 'sku', 'uom', 'id', 'po', 'qty' ].includes(plain)) return true;
  return false;
};

export const humanizeColumnKey = (key: string): string => {
  if (!key) return '';
  // Break camelCase and underscores into tokens first for abbreviation detection per base token.
  const raw = key;
  const tokens = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase -> spaced
    .replace(/_/g, ' ') // snake_case -> spaced
    .split(/\s+/)
    .filter(Boolean);
  const humanizedTokens = tokens.map(t => {
    const lower = t.toLowerCase();
    if (isAbbreviation(lower)) return lower.toUpperCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  return humanizedTokens.join(' ').trim();
};

// Derive keys from LineItem type (sanity assertion)
// If the LineItem definition changes, this assertion helps surface mismatch at compile time.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Exported only to satisfy lint: ensures we cover all columns defined in the LineItem type excluding lineNumber
export type _EnsureAllColumnsCovered = Exclude<keyof Omit<LineItem,'lineNumber'>, LineItemColumnKey> extends never ? true : never;
