import { describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';
import { getUnexpectedErrorCopy, translateError } from './api-error-copy';
import { localizeValidationMessage } from '~/domains/auth/utils/validation-message';

function buildFetchError(status: number, data?: unknown): FetchError {
  return Object.assign(new FetchError('request failed', { cause: new Error('boom') }), {
    status,
    data,
  }) as FetchError;
}

const vi = (key: string, params?: Record<string, string | number>) => {
  const messages: Record<string, string> = {
    'errors.generic.title': 'Đã xảy ra lỗi',
    'errors.generic.description': 'Vui lòng thử lại sau giây lát.',
    'errors.validation.passwordMinLength': 'Dùng ít nhất {count} ký tự',
    'errors.validation.emailInvalid': 'Nhập đầy đủ địa chỉ email, ví dụ ten@example.com',
    'errors.validation.generic': 'Vui lòng kiểm tra các trường được đánh dấu và thử lại.',
  };

  return (messages[key] ?? key).replace(/\{(\w+)\}/g, (placeholder, name: string) => (
    params && name in params ? String(params[name]) : placeholder
  ));
};

describe('getUnexpectedErrorCopy', () => {
  it('returns the one generic localized fallback for an unknown API error', () => {
    const copy = getUnexpectedErrorCopy(buildFetchError(StatusCodes.BAD_REQUEST, {
      status_code: 400,
      code: 'BRAND_NEW_CODE',
      message: 'Raw English server message',
      request_id: 'req-42',
    }), vi);

    expect(copy).toEqual({
      title: 'Đã xảy ra lỗi',
      description: 'Vui lòng thử lại sau giây lát.',
    });
    expect(JSON.stringify(copy)).not.toContain('Raw English');
    expect(JSON.stringify(copy)).not.toContain('req-42');
  });
});

describe('localizeValidationMessage', () => {
  it('translates a known English validation string', () => {
    expect(localizeValidationMessage('Enter a full email address, like name@example.com', vi))
      .toBe('Nhập đầy đủ địa chỉ email, ví dụ ten@example.com');
  });

  it('translates a known pattern with its bound', () => {
    expect(localizeValidationMessage('Use at least 8 characters', vi))
      .toBe('Dùng ít nhất 8 ký tự');
  });

  it('falls back to the generic validation prompt for an unmapped string', () => {
    expect(localizeValidationMessage('Something new the form invented', translateError))
      .toBe('Please check the highlighted fields and try again.');
  });
});
