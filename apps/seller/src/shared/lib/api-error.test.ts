import { describe, expect, it } from 'vitest';
import { readApiError } from './api-error';

describe('readApiError', () => {
  it('reads the code and message the API rejected with', () => {
    const error = Object.assign(new Error('[POST] "/api/v1/shops/s/promo-codes": 409 Conflict'), {
      data: { statusCode: 409, code: 'PROMO_CODE_ALREADY_EXISTS', message: 'Promo code already exists' },
    });

    expect(readApiError(error)).toEqual({
      code: 'PROMO_CODE_ALREADY_EXISTS',
      message: 'Promo code already exists',
    });
  });

  it('reads a body wrapped in the response envelope', () => {
    const error = {
      message: '[POST] "/api/v1/shops/s/promo-codes": 400 Bad Request',
      response: { _data: { code: 'PROMO_CODE_PRODUCT_SCOPE_INVALID', message: 'A selected product belongs to another shop' } },
    };

    expect(readApiError(error)).toEqual({
      code: 'PROMO_CODE_PRODUCT_SCOPE_INVALID',
      message: 'A selected product belongs to another shop',
    });
  });

  it('joins the messages of a validation rejection that carries no code', () => {
    const error = {
      data: { message: ['percent_off must not be greater than 99', 'timezone must be a valid IANA zone'] },
    };

    expect(readApiError(error)).toEqual({
      code: undefined,
      message: 'percent_off must not be greater than 99, timezone must be a valid IANA zone',
    });
  });

  it('keeps the thrown message when the failure never reached the server', () => {
    expect(readApiError(new Error('Failed to fetch')))
      .toEqual({ code: undefined, message: 'Failed to fetch' });
  });

  it('returns an empty result for a rejection that carries nothing readable', () => {
    expect(readApiError({ data: {} })).toEqual({ code: undefined, message: undefined });
    expect(readApiError(undefined)).toEqual({ code: undefined, message: undefined });
  });
});
