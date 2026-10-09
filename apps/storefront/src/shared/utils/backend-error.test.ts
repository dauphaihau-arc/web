import { describe, expect, it } from 'vitest';
import { FetchError } from 'ofetch';
import { getBackendErrorCode, getBackendErrorMessage } from './backend-error';

function buildFetchError(data: unknown): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), { data }) as FetchError;
}

describe('getBackendErrorMessage', () => {
  it('composes the field messages of a validation rejection over its generic summary', () => {
    const error = buildFetchError({
      status_code: 422,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details: {
        fields: [
          { field: 'quantity', messages: ['quantity must not be less than 1'] },
          { field: 'preferences.region', messages: ['region must be a known market'] },
        ],
      },
    });

    expect(getBackendErrorMessage(error)).toBe(
      'quantity must not be less than 1, region must be a known market',
    );
  });

  it('falls back to the generic summary when a validation rejection has no fields', () => {
    const error = buildFetchError({
      status_code: 422,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
    });

    expect(getBackendErrorMessage(error)).toBe('Validation failed');
  });

  it('returns a business code message unchanged', () => {
    const error = buildFetchError({
      status_code: 409,
      code: 'CART_QUANTITY_EXCEEDS_STOCK',
      message: 'Quantity of product exceeds stock',
    });

    expect(getBackendErrorCode(error)).toBe('CART_QUANTITY_EXCEEDS_STOCK');
    expect(getBackendErrorMessage(error)).toBe('Quantity of product exceeds stock');
  });
});
