import { describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';
import { resolvePromoCodeErrorMessage } from './promo-code-error';

function buildFetchError(status: number, data?: unknown): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), {
    status,
    data,
  }) as FetchError;
}

describe('resolvePromoCodeErrorMessage', () => {
  it('renders precise copy from the server reason', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      message: 'Promo code NOIRLIMIT cannot be applied to this cart',
      reason: 'usage_limit_reached',
    }))).toBe('This promo code has been fully redeemed');

    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      reason: 'authentication_required',
    }))).toBe('Sign in to use this promo code');
  });

  it('falls back to the server message for an unknown reason', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      message: 'Promo code X cannot be applied to this cart',
      reason: 'something_new',
    }))).toBe('Promo code X cannot be applied to this cart');
  });

  it('falls back when the server sends no reason', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      message: 'Promo code X cannot be applied to this cart',
    }))).toBe('Promo code X cannot be applied to this cart');

    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY)))
      .toBe('Promo code cannot be applied');
  });

  it('maps a missing code and an unknown failure', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.NOT_FOUND)))
      .toBe('Promo code not found');
    expect(resolvePromoCodeErrorMessage(new Error('network'))).toBe('Add promo code failed');
  });
});
