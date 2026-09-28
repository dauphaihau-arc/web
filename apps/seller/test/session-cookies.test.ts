import {
  describe, expect, it, vi,
} from 'vitest';
import {
  isExpiredAccessToken, parseCookieHeader, shouldRefreshSession,
} from '../src/server/utils/session-cookies';

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function tokenWithExpiry(exp: number) {
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp })}.signature`;
}

describe('parseCookieHeader', () => {
  it('reads cookie pairs and drops malformed segments', () => {
    expect(parseCookieHeader('accessToken=abc; refreshToken=def=ghi; broken; =empty')).toEqual({
      accessToken: 'abc',
      refreshToken: 'def=ghi',
    });
  });

  it('returns no cookies for a missing header', () => {
    expect(parseCookieHeader(undefined)).toEqual({});
  });
});

describe('isExpiredAccessToken', () => {
  it('reports a token whose expiry has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:15:01Z'));

    expect(isExpiredAccessToken(tokenWithExpiry(Date.parse('2026-01-01T00:15:00Z') / 1000))).toBe(true);

    vi.useRealTimers();
  });

  it('keeps a token whose expiry is still ahead', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:14:59Z'));

    expect(isExpiredAccessToken(tokenWithExpiry(Date.parse('2026-01-01T00:15:00Z') / 1000))).toBe(false);

    vi.useRealTimers();
  });

  it('treats an unreadable token as not expired so the refresh is skipped', () => {
    expect(isExpiredAccessToken('not-a-jwt')).toBe(false);
    expect(isExpiredAccessToken(`${encode({ typ: 'JWT' })}.not-base64-json.signature`)).toBe(false);
  });

  it('treats a signed token without expiry as expired', () => {
    expect(isExpiredAccessToken(`${encode({ alg: 'HS256' })}.${encode({ sub: 'user-1' })}.signature`)).toBe(true);
  });
});

describe('shouldRefreshSession', () => {
  it('refreshes when the access cookie is missing but the refresh cookie exists', () => {
    expect(shouldRefreshSession({ refreshToken: 'refresh-value' })).toBe(true);
  });

  it('refreshes when the access token is expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:15:01Z'));

    expect(shouldRefreshSession({
      refreshToken: 'refresh-value',
      accessToken: tokenWithExpiry(Date.parse('2026-01-01T00:15:00Z') / 1000),
    })).toBe(true);

    vi.useRealTimers();
  });

  it('skips the refresh when the access token is still valid', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:14:59Z'));

    expect(shouldRefreshSession({
      refreshToken: 'refresh-value',
      accessToken: tokenWithExpiry(Date.parse('2026-01-01T00:15:00Z') / 1000),
    })).toBe(false);

    vi.useRealTimers();
  });

  it('skips the refresh when no session is present', () => {
    expect(shouldRefreshSession({})).toBe(false);
    expect(shouldRefreshSession({ accessToken: 'expired.or.missing' })).toBe(false);
  });
});
