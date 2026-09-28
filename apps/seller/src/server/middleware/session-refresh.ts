import { parseCookieHeader, shouldRefreshSession } from '../utils/session-cookies';

const REFRESH_PATH = '/v1/auth/refresh';

/**
 * A seller whose access token expired (or was never set) still holds a valid
 * refresh token, and the request that would use it is rendered on the server.
 * Reflect the rotation back to the browser and use the fresh access token for
 * this render, so a missing or expired access token does not read as a
 * signed-out seller on a server-rendered page.
 */
export default defineEventHandler(async (event) => {
  if (!['GET', 'HEAD'].includes(event.method) || event.path.startsWith('/api/')) {
    return;
  }

  const cookieHeader = getHeader(event, 'cookie');
  const cookies = parseCookieHeader(cookieHeader);

  if (!shouldRefreshSession(cookies)) {
    return;
  }

  const { apiOrigin } = useRuntimeConfig(event).public;

  try {
    const response = await $fetch.raw(REFRESH_PATH, {
      baseURL: apiOrigin,
      method: 'POST',
      headers: { cookie: cookieHeader ?? '' },
      retry: 0,
    });

    for (const setCookie of response.headers.getSetCookie()) {
      appendResponseHeader(event, 'set-cookie', setCookie);

      const [pair = ''] = setCookie.split(';');
      const separatorIndex = pair.indexOf('=');

      if (separatorIndex > 0) {
        cookies[pair.slice(0, separatorIndex)] = pair.slice(separatorIndex + 1);
      }
    }

    // The render that follows reads the session from the request cookies.
    event.node.req.headers.cookie = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
  catch {
    // A rejected refresh means the session is gone; the app renders as a guest.
  }
});
