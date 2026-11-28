import { FetchError } from 'ofetch';
import { describe, expect, it } from 'vitest';
import {
  getCheckoutFailureCopy,
  getDroppedPromoCodesToast,
  resolveCheckoutFailure,
  resolveCheckoutShippingUnavailableKind,
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

  it('keeps an address-only rejection address-actionable', () => {
    const error = buildCheckoutError('CHECKOUT_SHIPPING_UNAVAILABLE', [
      'unsupported_destination',
    ]);

    expect(resolveCheckoutShippingUnavailableKind(error)).toBe('destination');
    expect(getCheckoutFailureCopy('shipping_unavailable', undefined, 'destination')).toEqual({
      title: 'Shipping unavailable',
      description: 'We can\'t ship the selected items to this address. ' +
        'Change the delivery address or remove the item.',
    });
  });

  it('keeps a currency rejection currency-actionable', () => {
    const error = buildCheckoutError('CHECKOUT_SHIPPING_UNAVAILABLE', [
      'unsupported_currency',
    ]);

    expect(resolveCheckoutShippingUnavailableKind(error)).toBe('currency');
    expect(getCheckoutFailureCopy('shipping_unavailable', undefined, 'currency')).toEqual({
      title: 'Shipping unavailable',
      description: 'The selected items can\'t be priced in this currency. ' +
        'Change the currency or remove the item.',
    });
  });

  it('collapses internal and mixed reasons to the generic copy', () => {
    const internal = buildCheckoutError('CHECKOUT_SHIPPING_UNAVAILABLE', [
      'profile_not_found',
    ]);
    const mixed = buildCheckoutError('CHECKOUT_SHIPPING_UNAVAILABLE', [
      'unsupported_destination',
      'unsupported_currency',
    ]);

    expect(resolveCheckoutShippingUnavailableKind(internal)).toBe('unavailable');
    expect(resolveCheckoutShippingUnavailableKind(mixed)).toBe('unavailable');
    expect(getCheckoutFailureCopy('shipping_unavailable', undefined, 'unavailable')).toEqual({
      title: 'Shipping unavailable',
      description: 'Shipping options are unavailable for the selected items. ' +
        'Contact the seller or remove the item.',
    });
  });
});
