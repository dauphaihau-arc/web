import { describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';
import { resolvePromoCodeErrorMessage } from './promo-code-error';
import { resolveFormattingLocale } from '~/shared/utils/locale-format';

const vi = (key: string, params?: Record<string, string | number>) => {
  const messages: Record<string, string> = {
    'errors.promo.usageLimitReached': 'Mã khuyến mãi này đã được dùng hết',
    'errors.promo.authenticationRequired': 'Đăng nhập để dùng mã khuyến mãi này',
    'errors.generic.title': 'Đã xảy ra lỗi',
    'errors.promo.applyFailed': 'Áp dụng mã khuyến mãi thất bại',
    'errors.validation.passwordMinLength': 'Dùng ít nhất {count} ký tự',
  };

  return (messages[key] ?? key).replace(/\{(\w+)\}/g, (placeholder, name: string) => (
    params && name in params ? String(params[name]) : placeholder
  ));
};

function buildFetchError(status: number, data?: unknown): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), {
    status,
    data,
  }) as FetchError;
}

describe('resolvePromoCodeErrorMessage', () => {
  it('renders precise copy from a known server code', () => {
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

  it('translates a known code with the supplied locale translator', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      code: 'PROMOTION_USAGE_LIMIT_REACHED',
      message: 'Promo code NOIRLIMIT cannot be applied to this cart',
    }), vi)).toBe('Mã khuyến mãi này đã được dùng hết');
  });

  it('shows generic localized copy for an unknown code instead of the server message', () => {
    const message = resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      code: 'PROMOTION_SOMETHING_NEW',
      message: 'Promo code X cannot be applied to this cart',
      request_id: 'req-123',
    }));

    expect(message).toBe('Something went wrong');
    expect(message).not.toContain('Promo code X');
    expect(message).not.toContain('req-123');
  });

  it('never shows the server message when the code is missing', () => {
    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
      message: 'Promo code X cannot be applied to this cart',
    }))).toBe('Something went wrong');

    expect(resolvePromoCodeErrorMessage(buildFetchError(StatusCodes.UNPROCESSABLE_ENTITY, {
      status_code: 422,
    }))).toBe('Something went wrong');
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

describe('promo formatting locale', () => {
  it('composes the locale from language and region for dates and numbers', () => {
    expect(resolveFormattingLocale('vi', 'Vietnam')).toBe('vi-VN');
    expect(resolveFormattingLocale('en', 'United States')).toBe('en-US');
  });
});
