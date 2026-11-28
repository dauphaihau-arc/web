import { FetchError } from 'ofetch';
import { describe, expect, it } from 'vitest';
import {
  getCheckoutFailureCopy,
  getDroppedPromoCodesToast,
  resolveCheckoutFailure,
} from './checkout-error';

function buildCheckoutError(
  code: string,
  reasons: string[],
): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), {
    data: {
      status_code: 409,
      code,
      message: 'Selected items cannot be shipped to the provided address',
      details: {
        products: reasons.map(reason => ({ reason })),
      },
    },
  }) as FetchError;
}

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

describe('checkout shipping failures', () => {
  it('maps the server shipping code to its own failure', () => {
    const error = buildCheckoutError('CHECKOUT_SHIPPING_UNAVAILABLE', [
      'unsupported_destination',
    ]);

    expect(resolveCheckoutFailure(error)).toBe('shipping_unavailable');
  });

  it('uses the actionable shipping copy', () => {
    expect(getCheckoutFailureCopy('shipping_unavailable')).toEqual({
      title: 'Shipping unavailable',
      description: 'We can\'t complete shipping for the selected items. ' +
        'Review the delivery address and currency, or remove an item.',
    });
  });
});
