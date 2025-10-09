import type { LineItemColumnKey } from './lineItemColumns';

// Branded primitive types to avoid accidental mixups
export type FieldId = string & { readonly __brand: 'FieldId' };
export type BoundingBoxId = string & { readonly __brand: 'BoundingBoxId' };

// Factory helpers for line item field ids
export const makeLineItemField = (lineNumber: number, column: LineItemColumnKey): FieldId => `lineItem-${lineNumber}-${column}` as FieldId;

export interface ParsedLineItemFieldId { lineNumber: number; column: LineItemColumnKey; }

const LINE_ITEM_FIELD_REGEX = /^lineItem-(\d+)-(sku|description|quantity|unitPrice)$/;

export const parseLineItemField = (id: string): ParsedLineItemFieldId | null => {
  const m = LINE_ITEM_FIELD_REGEX.exec(id);
  if (!m) return null;
  return { lineNumber: parseInt(m[1], 10), column: m[2] as LineItemColumnKey };
};

export const isLineItemFieldId = (id: string): id is FieldId => LINE_ITEM_FIELD_REGEX.test(id);
