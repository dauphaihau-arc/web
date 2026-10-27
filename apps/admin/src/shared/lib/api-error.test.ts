import { describe, expect, it } from 'vitest';
import { readApiError } from './api-error';

describe('readApiError', () => {
  it('reads the code and message the API rejected with', () => {
    const error = Object.assign(new Error('[POST] "/api/v1/shops/s/promo-codes": 409 Conflict'), {
      data: { status_code: 409, code: 'PROMO_CODE_ALREADY_EXISTS', message: 'Promo code already exists' },
    });

    expect(readApiError(error)).toEqual({
      code: 'PROMO_CODE_ALREADY_EXISTS',
      message: 'Promo code already exists',
    });
  });

  it('reads a body wrapped in the response envelope', () => {
    const error = {
      message: '[POST] "/api/v1/shops/s/promo-codes": 400 Bad Request',
      response: { _data: { status_code: 400, code: 'PROMO_CODE_PRODUCT_SCOPE_INVALID', message: 'A selected product belongs to another shop' } },
    };

    expect(readApiError(error)).toEqual({
      code: 'PROMO_CODE_PRODUCT_SCOPE_INVALID',
      message: 'A selected product belongs to another shop',
    });
  });

  it('exposes structured validation fields and composes their messages over the generic summary', () => {
    const error = {
      data: {
        status_code: 422,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: {
          fields: [
            { field: 'percent_off', messages: ['percent_off must not be greater than 99'] },
            { field: 'timezone', messages: ['timezone must be a valid IANA zone', 'timezone must be a string'] },
          ],
        },
      },
    };

    expect(readApiError(error)).toEqual({
      code: 'VALIDATION_FAILED',
      message: 'percent_off must not be greater than 99, timezone must be a valid IANA zone, timezone must be a string',
      fields: [
        { field: 'percent_off', message: 'percent_off must not be greater than 99' },
        { field: 'timezone', message: 'timezone must be a valid IANA zone, timezone must be a string' },
      ],
    });
  });

  it('keeps the generic summary when a validation rejection carries no fields', () => {
    const error = {
      data: { status_code: 422, code: 'VALIDATION_FAILED', message: 'Validation failed' },
    };

    expect(readApiError(error)).toEqual({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
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
