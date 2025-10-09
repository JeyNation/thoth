import { describe, it, expect } from 'vitest';
import { addBlankLineItem, removeLineItem, computeNextLineNumber, ensureLineNumberExists, checkPurchaseOrderInvariants, insertBlankLineItem } from '../utils/purchaseOrderMutations';
import type { PurchaseOrder } from '../types/PurchaseOrder';

const basePO = (): PurchaseOrder => ({ documentNumber: '', customerNumber: '', shipToAddress: '', lineItems: [] });

describe('purchaseOrderMutations', () => {
  it('adds blank line item sequentially', () => {
    let po = basePO();
    po = addBlankLineItem(po); // line 1
    po = addBlankLineItem(po); // line 2
    expect(po.lineItems.map(li => li.lineNumber)).toEqual([1,2]);
  });

  it('computeNextLineNumber after removal (compaction) appends sequentially', () => {
    let po = basePO();
    po = addBlankLineItem(po); // 1
    po = addBlankLineItem(po); // 2
    const removed = removeLineItem(po, 1);
    po = removed.purchaseOrder; // compaction shifts old 2 -> 1
    expect(po.lineItems.map(li => li.lineNumber)).toEqual([1]);
    expect(computeNextLineNumber(po)).toBe(2); // next sequential
  });

  it('ensureLineNumberExists idempotent', () => {
    let po = basePO();
    po = addBlankLineItem(po); // 1
    const again = ensureLineNumberExists(po, 1);
    expect(again.lineItems.length).toBe(1);
  });

  it('removeLineItem returns affected mapping fieldIds', () => {
    let po = basePO();
    po = addBlankLineItem(po); // line 1
    const { purchaseOrder: next, removedFieldIds, remappedFieldIds } = removeLineItem(po, 1);
    expect(next.lineItems.length).toBe(0);
    expect(removedFieldIds.sort()).toEqual([
      'lineItem-1-sku','lineItem-1-description','lineItem-1-quantity','lineItem-1-unitPrice'
    ].sort());
    expect(remappedFieldIds.length).toBe(0);
  });

  it('invariant check flags orphan field ids', () => {
    let po = basePO();
    po = addBlankLineItem(po); // line 1
    const issues = checkPurchaseOrderInvariants(po, ['lineItem-1-sku','lineItem-2-sku']);
    expect(issues.some(i => i.type === 'ORPHAN_FIELD')).toBe(true);
  });

  it('removal compacts subsequent line numbers and reports remaps', () => {
    let po = basePO();
    po = addBlankLineItem(po); //1
    po = addBlankLineItem(po); //2
    po = addBlankLineItem(po); //3
    const { purchaseOrder: next, remappedFieldIds } = removeLineItem(po, 2); // remove middle
    expect(next.lineItems.map(li => li.lineNumber)).toEqual([1,2]); // old 3 -> 2
    expect(remappedFieldIds).toContainEqual({ oldId: 'lineItem-3-sku', newId: 'lineItem-2-sku' });
    expect(remappedFieldIds).toContainEqual({ oldId: 'lineItem-3-description', newId: 'lineItem-2-description' });
  });

  it('insertBlankLineItem shifts subsequent lines and reports remapped field ids', () => {
    let po = basePO();
    po = addBlankLineItem(po); // 1
    po = addBlankLineItem(po); // 2
    po = addBlankLineItem(po); // 3
    const result = insertBlankLineItem(po, 1); // insert after line 1 -> new line 2, old 2->3, old 3->4
    const numbers = result.purchaseOrder.lineItems.map(li => li.lineNumber).sort((a,b)=>a-b);
    expect(numbers).toEqual([1,2,3,4]);
    // Ensure blank line inserted has no data
    const inserted = result.purchaseOrder.lineItems.find(li => li.lineNumber === 2)!;
    expect(inserted.sku).toBe('');
    expect(result.remappedFieldIds).toContainEqual({ oldId: 'lineItem-2-sku', newId: 'lineItem-3-sku' });
    expect(result.remappedFieldIds).toContainEqual({ oldId: 'lineItem-3-sku', newId: 'lineItem-4-sku' });
  });
});
