import { describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';
import { resolveCouponErrorMessage } from './coupon-error';

function buildFetchError(status: number, data?: unknown): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), {
    status,
    data,
  }) as FetchError;
}

describe('resolveCouponErrorMessage', () => {
  it('renders precise copy from the server reason', () => {
    expect(resolveCouponErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      message: 'Coupon code NOIRLIMIT cannot be applied to this cart',
      reason: 'usage_limit_reached',
    }))).toBe('This promo code has been fully redeemed');

    expect(resolveCouponErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      reason: 'authentication_required',
    }))).toBe('Sign in to use this promo code');
  });

  it('falls back to the server message for an unknown reason', () => {
    expect(resolveCouponErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      message: 'Coupon code X cannot be applied to this cart',
      reason: 'something_new',
    }))).toBe('Coupon code X cannot be applied to this cart');
  });

  it('falls back when the server sends no reason', () => {
    expect(resolveCouponErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      message: 'Coupon code X cannot be applied to this cart',
    }))).toBe('Coupon code X cannot be applied to this cart');

    expect(resolveCouponErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY)))
      .toBe('Coupon code cannot be applied');
  });

  it('maps a missing code and an unknown failure', () => {
    expect(resolveCouponErrorMessage(buildFetchError(StatusCodes.NOT_FOUND)))
      .toBe('Coupon code not found');
    expect(resolveCouponErrorMessage(new Error('network'))).toBe('Add coupon failed');
  });
});
