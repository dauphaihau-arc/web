const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

export function parseCookies(cookieHeader: string | undefined) {
  return (cookieHeader ?? '')
    .split(';')
    .map(segment => segment.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, segment) => {
      const separatorIndex = segment.indexOf('=');

      if (separatorIndex > 0) {
        cookies[segment.slice(0, separatorIndex)] = segment.slice(separatorIndex + 1);
      }

      return cookies;
    }, {});
}

// A refresh token is only useful while the session still exists. The access
// token being absent is just as recoverable as it being expired, so both states
// have to reach the refresh endpoint.
export function shouldRefreshSession(cookies: Record<string, string>) {
  if (!cookies[REFRESH_COOKIE_NAME]) {
    return false;
  }

  const accessToken = cookies[ACCESS_COOKIE_NAME];

  return !accessToken || isExpiredAccessToken(accessToken);
}

// The payload is only read to find out whether the access token is still valid;
// the API verifies the signature. An unusable value simply skips the refresh.
export function isExpiredAccessToken(token: string) {
  const [, payload] = token.split('.');

  if (!payload) {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };

    return typeof exp !== 'number' || exp * 1000 <= Date.now();
  }
  catch {
    return false;
  }
}
