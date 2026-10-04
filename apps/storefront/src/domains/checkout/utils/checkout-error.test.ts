import { describe, expect, it } from 'vitest';
import { getDroppedPromoCodesToast } from './checkout-error';

describe('getDroppedPromoCodesToast', () => {
  it('returns nothing when no code was dropped', () => {
    expect(getDroppedPromoCodesToast([])).toBeUndefined();
  });

  it('names a single removed code', () => {
    expect(getDroppedPromoCodesToast(['NOIR-LIMIT-7'])).toEqual({
      title: 'Promo code removed',
      description: 'NOIR-LIMIT-7 was removed because it is no longer available. ' +
        'Review the updated total and confirm your order again.',
    });
  });

  it('names several removed codes as a plural', () => {
    expect(getDroppedPromoCodesToast(['GONE20', 'ALSO-GONE'])).toEqual({
      title: 'Promo codes removed',
      description: 'GONE20, ALSO-GONE were removed because they are no longer available. ' +
        'Review the updated total and confirm your order again.',
    });
  });
});
