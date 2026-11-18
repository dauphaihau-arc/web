import { describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';
import {
  getAddToCartFailureCopy,
  resolveAddToCartFailure,
} from './cart-error';

function buildFetchError(status: number, data?: unknown): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), {
    status,
    data,
  }) as FetchError;
}

describe('cart failure copy', () => {
  it('maps a known quantity code to localized stock copy', () => {
    const error = buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      code: 'CART_QUANTITY_EXCEEDS_STOCK',
      message: 'Quantity of product exceeds stock',
    });

    expect(resolveAddToCartFailure(error)).toBe('quantity_exceeds_stock');
    expect(getAddToCartFailureCopy('quantity_exceeds_stock', { isBuyNow: false })).toEqual({
      title: 'Stock no longer available',
      description: 'The requested quantity is no longer available. Update your selection and try again.',
    });
  });

  it('uses the supplied locale translator for a known kind', () => {
    const vi = (key: string) => ({
      'errors.cart.stockUnavailable.title': 'Mặt hàng không còn đủ số lượng',
      'errors.cart.stockUnavailable.description': 'Số lượng yêu cầu không còn khả dụng. Hãy cập nhật lựa chọn và thử lại.',
    }[key] ?? key);

    expect(getAddToCartFailureCopy('out_of_stock', { isBuyNow: false, t: vi })).toEqual({
      title: 'Mặt hàng không còn đủ số lượng',
      description: 'Số lượng yêu cầu không còn khả dụng. Hãy cập nhật lựa chọn và thử lại.',
    });
  });

  it('falls back to generic action copy for an unknown failure', () => {
    const error = buildFetchError(StatusCodes.BAD_REQUEST, {
      status_code: 400,
      code: 'SOMETHING_NEW',
      message: 'Internal English wording the buyer must not see',
    });

    expect(resolveAddToCartFailure(error)).toBe('unknown');

    const copy = getAddToCartFailureCopy('unknown', { isBuyNow: false });

    expect(copy.title).toBe('Something went wrong');
    expect(copy.description).toBe('Please try again in a moment.');
    expect(copy.title).not.toContain('Internal English');
  });
});
