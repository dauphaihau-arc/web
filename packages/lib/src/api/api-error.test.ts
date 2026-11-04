import { describe, expect, it } from 'vitest';
import { getApiErrorResponse } from './api-error';
import { isRecoverableAuthError } from './api-client';

function envelope(code = 'ACCESS_TOKEN_EXPIRED') {
  return { status_code: 401, code, message: 'Access token expired' };
}

describe('getApiErrorResponse', () => {
  it('reads the envelope from the raw response body', () => {
    const error = { status: 401, response: { _data: envelope() } };

    expect(getApiErrorResponse(error)).toEqual(envelope());
  });

  it('reads the envelope from a flat data property', () => {
    const error = { data: envelope('ACCESS_TOKEN_MISSING') };

    expect(getApiErrorResponse(error)).toEqual(envelope('ACCESS_TOKEN_MISSING'));
  });

  it('reads the envelope from response.data', () => {
    const error = { response: { data: envelope('INVALID_SIGNATURE') } };

    expect(getApiErrorResponse(error)).toEqual(envelope('INVALID_SIGNATURE'));
  });

  it('prefers data over the response body', () => {
    const flat = envelope('ACCESS_TOKEN_EXPIRED');
    const error = { data: flat, response: { _data: envelope('ACCESS_TOKEN_MISSING') } };

    expect(getApiErrorResponse(error)).toEqual(flat);
  });

  it('returns undefined for null', () => {
    expect(getApiErrorResponse(null)).toBeUndefined();
  });

  it('returns undefined for a plain Error', () => {
    expect(getApiErrorResponse(new Error('boom'))).toBeUndefined();
  });

  it('returns undefined when the code is not a string', () => {
    expect(getApiErrorResponse({ data: { status_code: 401, code: 42 } })).toBeUndefined();
  });

  it('returns undefined when the status code is not a number', () => {
    expect(getApiErrorResponse({ data: { status_code: '401', code: 'ACCESS_TOKEN_EXPIRED' } })).toBeUndefined();
  });

  it('returns undefined for primitives', () => {
    expect(getApiErrorResponse('ACCESS_TOKEN_EXPIRED')).toBeUndefined();
    expect(getApiErrorResponse(401)).toBeUndefined();
  });
});

describe('isRecoverableAuthError with the typed envelope', () => {
  it('accepts a recoverable code delivered through response._data', () => {
    expect(isRecoverableAuthError({
      status: 401,
      response: { _data: envelope('ACCESS_TOKEN_EXPIRED') },
    })).toBe(true);
  });

  it('rejects an unknown error code', () => {
    expect(isRecoverableAuthError({
      status: 401,
      response: { _data: envelope('UNAUTHENTICATED') },
    })).toBe(false);
  });
});
