import { describe, it, expect } from 'vitest';
import { makeLineItemField, parseLineItemField, isLineItemFieldId } from '../types/fieldIds';

describe('fieldIds helpers', () => {
  it('round-trips line item field id', () => {
    const fid = makeLineItemField(12, 'quantity');
    expect(isLineItemFieldId(fid)).toBe(true);
    const parsed = parseLineItemField(fid);
    expect(parsed).toEqual({ lineNumber: 12, column: 'quantity' });
  });

  it('rejects non line item id', () => {
    expect(parseLineItemField('documentNumber')).toBeNull();
    expect(isLineItemFieldId('documentNumber')).toBe(false);
  });
});
