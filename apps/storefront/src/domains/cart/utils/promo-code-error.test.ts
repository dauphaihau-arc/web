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
  it('renders precise copy from the server code', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      code: 'PROMOTION_USAGE_LIMIT_REACHED',
      message: 'Promo code NOIRLIMIT cannot be applied to this cart',
    }))).toBe('This promo code has been fully redeemed');

    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      code: 'PROMOTION_AUTHENTICATION_REQUIRED',
      message: 'Sign in to apply this promo code',
    }))).toBe('Sign in to use this promo code');
  });

  it('falls back to the server message for a code the client does not know', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      code: 'PROMOTION_SOMETHING_NEW',
      message: 'Promo code X cannot be applied to this cart',
    }))).toBe('Promo code X cannot be applied to this cart');
  });

  it('falls back when the server sends no code', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      message: 'Promo code X cannot be applied to this cart',
    }))).toBe('Promo code X cannot be applied to this cart');

    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
    }))).toBe('Promo code cannot be applied');
  });

  it('maps a missing code and an unknown failure', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.NOT_FOUND, {
      status_code: 404,
      code: 'PROMOTION_CODE_NOT_FOUND',
      message: 'Promotion code X not found',
    }))).toBe('Promo code not found');

    expect(resolvePromoCodeErrorMessage(new Error('network'))).toBe('Add promo code failed');
  });
});
