import { describe, expect, it } from 'vitest';
import {
  buildPromoCodeRemovalNotices,
  findDroppedPromoCodes,
} from './reconcile-applied-promo-codes';

describe('buildPromoCodeRemovalNotices', () => {
  it('builds one explaining line per removed code', () => {
    expect(buildPromoCodeRemovalNotices(['GONE20'])).toEqual([
      { code: 'GONE20', message: 'Promo code GONE20 is no longer available and was removed.' },
    ]);
    expect(buildPromoCodeRemovalNotices([])).toEqual([]);
  });
});

describe('findDroppedPromoCodes', () => {
  it('reports the codes the refreshed quote no longer accepts', () => {
    const dropped = findDroppedPromoCodes(
      [{ shopId: 'shop-1', promoCodes: ['KEEP10', 'GONE20'] }],
      [{ shopId: 'shop-1', promoCodes: ['KEEP10'] }],
    );

    expect(dropped.get('shop-1')).toEqual(['GONE20']);
  });

  it('reports nothing when every applied code is still accepted', () => {
    const dropped = findDroppedPromoCodes(
      [{ shopId: 'shop-1', promoCodes: ['KEEP10'] }],
      [{ shopId: 'shop-1', promoCodes: ['KEEP10'] }],
    );

    expect(dropped.size).toBe(0);
  });

  it('leaves a shop the quote does not contain alone', () => {
    const dropped = findDroppedPromoCodes(
      [{ shopId: 'shop-missing', promoCodes: ['GONE20'] }],
      [{ shopId: 'shop-1', promoCodes: [] }],
    );

    expect(dropped.size).toBe(0);
  });

  it('reconciles each shop independently', () => {
    const dropped = findDroppedPromoCodes(
      [
        { shopId: 'shop-1', promoCodes: ['A10', 'B20'] },
        { shopId: 'shop-2', promoCodes: ['C30'] },
      ],
      [
        { shopId: 'shop-1', promoCodes: ['A10'] },
        { shopId: 'shop-2', promoCodes: ['C30'] },
      ],
    );

    expect(dropped.get('shop-1')).toEqual(['B20']);
    expect(dropped.has('shop-2')).toBe(false);
  });
});
