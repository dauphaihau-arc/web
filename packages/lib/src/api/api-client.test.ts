import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import {
  createApiClient,
  isRecoverableAuthError,
  isUnauthorizedError,
} from './api-client';

const REFRESH_URL = '/auth/refresh';

const fetchMock = vi.fn();

vi.stubGlobal('$fetch', fetchMock);

function createClient() {
  return createApiClient({
    getBaseURL: () => '/v1',
    refreshSession: { url: REFRESH_URL },
  });
}

function authError(status: number, code?: string) {
  return { status, data: code === undefined ? undefined : { code } };
}

function countRefreshCalls() {
  return fetchMock.mock.calls.filter(([url]) => url === REFRESH_URL).length;
}

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.stubGlobal('$fetch', fetchMock);
});

describe('isRecoverableAuthError', () => {
  it('accepts only the session-recoverable 401 codes', () => {
    expect(isRecoverableAuthError(authError(401, 'ACCESS_TOKEN_EXPIRED'))).toBe(true);
    expect(isRecoverableAuthError(authError(401, 'ACCESS_TOKEN_MISSING'))).toBe(true);
    expect(isRecoverableAuthError(authError(401, 'UNAUTHENTICATED'))).toBe(false);
    expect(isRecoverableAuthError(authError(401))).toBe(false);
    expect(isRecoverableAuthError(authError(403, 'ACCESS_TOKEN_EXPIRED'))).toBe(false);
  });

  it('reads the code from the raw response body as well', () => {
    expect(isRecoverableAuthError({
      status: 401,
      response: { _data: { code: 'ACCESS_TOKEN_MISSING' } },
    })).toBe(true);
  });

  it('keeps the generic unauthorized check unchanged', () => {
    expect(isUnauthorizedError(authError(401))).toBe(true);
    expect(isUnauthorizedError(authError(403))).toBe(false);
  });
});

describe('createApiClient auth recovery', () => {
  it('refreshes and retries once when the access token expired', async () => {
    fetchMock
      .mockRejectedValueOnce(authError(401, 'ACCESS_TOKEN_EXPIRED'))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ user: 'seller-1' });

    await expect(createClient().get('/auth/me')).resolves.toEqual({ user: 'seller-1' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(REFRESH_URL);
  });

  it('refreshes when the access cookie is missing but the refresh cookie exists', async () => {
    fetchMock
      .mockRejectedValueOnce(authError(401, 'ACCESS_TOKEN_MISSING'))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ user: 'seller-1' });

    await expect(createClient().get('/auth/me')).resolves.toEqual({ user: 'seller-1' });

    expect(countRefreshCalls()).toBe(1);
  });

  it('does not refresh a generic 401', async () => {
    fetchMock.mockRejectedValueOnce(authError(401, 'UNAUTHENTICATED'));

    await expect(createClient().get('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(countRefreshCalls()).toBe(0);
  });

  it('does not refresh a 401 without an error code', async () => {
    fetchMock.mockRejectedValueOnce(authError(401));

    await expect(createClient().get('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(countRefreshCalls()).toBe(0);
  });

  it('does not refresh a 403 even with a recovery code in the body', async () => {
    fetchMock.mockRejectedValueOnce(authError(403, 'ACCESS_TOKEN_EXPIRED'));

    await expect(createClient().get('/auth/me')).rejects.toMatchObject({ status: 403 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(countRefreshCalls()).toBe(0);
  });

  it('does not refresh when the caller disables retryOnUnauthorized', async () => {
    fetchMock.mockRejectedValueOnce(authError(401, 'ACCESS_TOKEN_EXPIRED'));

    await expect(
      createClient().get('/auth/me', undefined, undefined, { retryOnUnauthorized: false }),
    ).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(countRefreshCalls()).toBe(0);
  });

  it('rethrows the original error when the refresh itself fails', async () => {
    const original = authError(401, 'ACCESS_TOKEN_EXPIRED');
    fetchMock
      .mockRejectedValueOnce(original)
      .mockRejectedValueOnce({ status: 500 });

    await expect(createClient().get('/auth/me')).rejects.toBe(original);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(countRefreshCalls()).toBe(1);
  });

  it('does not refresh a second time when the retry is still unauthorized', async () => {
    fetchMock
      .mockRejectedValueOnce(authError(401, 'ACCESS_TOKEN_EXPIRED'))
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(authError(401, 'ACCESS_TOKEN_EXPIRED'));

    await expect(createClient().get('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(countRefreshCalls()).toBe(1);
  });
});

describe('browser refresh single-flight', () => {
  it.each([true, false])('isolates refresh coordination to browsers: %s', async (browser) => {
    if (browser) {
      vi.stubGlobal('window', {});
    }
    let release!: () => void;
    const refresh = new Promise<void>((resolve) => { release = resolve; });
    const attempts = new Map<string, number>();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === REFRESH_URL) {
        await refresh;
        return;
      }
      const attempt = (attempts.get(url) ?? 0) + 1;
      attempts.set(url, attempt);
      if (attempt === 1) {
        throw authError(401, 'ACCESS_TOKEN_EXPIRED');
      }
      return { url };
    });
    const client = createClient();
    const requests = Promise.all([client.get('/orders'), client.get('/products')]);
    try {
      await vi.waitFor(() => expect(countRefreshCalls()).toBe(browser ? 1 : 2));
    }
    finally {
      release();
    }
    await expect(requests).resolves.toEqual([{ url: '/orders' }, { url: '/products' }]);
    expect([...attempts.values()]).toEqual([2, 2]);
    await expect(client.get('/next-session')).resolves.toEqual({ url: '/next-session' });
    expect(countRefreshCalls()).toBe(browser ? 2 : 3);
  });

  it('rejects all waiters on refresh failure and permits a later refresh', async () => {
    vi.stubGlobal('window', {});
    let rejectRefresh!: (error: unknown) => void;
    const refresh = new Promise<void>((_resolve, reject) => { rejectRefresh = reject; });
    const original = authError(401, 'ACCESS_TOKEN_EXPIRED');
    fetchMock.mockImplementation((url: string) => (
      url === REFRESH_URL ? refresh : Promise.reject(original)
    ));
    const client = createClient();
    const requests = Promise.allSettled([client.get('/orders'), client.get('/products')]);
    try {
      await vi.waitFor(() => expect(countRefreshCalls()).toBe(1));
    }
    finally {
      rejectRefresh({ status: 401 });
    }
    expect(await requests).toEqual([
      { status: 'rejected', reason: original },
      { status: 'rejected', reason: original },
    ]);
    fetchMock
      .mockRejectedValueOnce(original)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ user: 'seller-1' });
    await expect(client.get('/auth/me')).resolves.toEqual({ user: 'seller-1' });
    expect(countRefreshCalls()).toBe(2);
  });
});
