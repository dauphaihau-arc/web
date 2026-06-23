import {
  afterEach, beforeEach, describe, expect, it, vi
} from 'vitest';

const {
  defineNuxtRouteMiddlewareMock,
  navigateToMock,
} = vi.hoisted(() => ({
  defineNuxtRouteMiddlewareMock: vi.fn((middleware: unknown) => middleware),
  navigateToMock: vi.fn(),
}));

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: defineNuxtRouteMiddlewareMock,
  navigateTo: navigateToMock,
}));

describe('auth middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('~/shared/server-state/me/current-user.query');
    vi.doUnmock('~/shared/navigation/routes');
    vi.doUnmock('~/shared/composables/use-backend-status');
  });

  it('allows authenticated users through auth middleware without redirecting', async () => {
    const refetch = vi.fn();

    vi.doMock('~/shared/server-state/me/current-user.query', () => ({
      useGetCurrentUser: () => ({
        data: { value: { user: { id: 'user-1' } } },
        refetch,
      }),
    }));
    vi.doMock('~/shared/navigation/routes', () => ({
      routes: { home: () => '/' },
    }));
    vi.doMock('~/shared/composables/use-backend-status', () => ({
      isBackendWakeUpError: () => false,
    }));

    const middleware = (await import('./auth')).default;

    const result = await middleware({} as never, {} as never);

    expect(result).toBeUndefined();
    expect(refetch).not.toHaveBeenCalled();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it('redirects guests on protected routes after current user resolves to null', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.doMock('~/shared/server-state/me/current-user.query', () => ({
      useGetCurrentUser: () => ({
        data: { value: { user: null } },
        refetch,
      }),
    }));
    vi.doMock('~/shared/navigation/routes', () => ({
      routes: { home: () => '/' },
    }));
    vi.doMock('~/shared/composables/use-backend-status', () => ({
      isBackendWakeUpError: () => false,
    }));

    navigateToMock.mockResolvedValue('/');

    const middleware = (await import('./auth')).default;

    const result = await middleware({} as never, {} as never);

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(result).toBeTruthy();
  });

  it('allows protected routes when refetch returns an authenticated user', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } });

    vi.doMock('~/shared/server-state/me/current-user.query', () => ({
      useGetCurrentUser: () => ({
        data: { value: { user: null } },
        refetch,
      }),
    }));
    vi.doMock('~/shared/navigation/routes', () => ({
      routes: { home: () => '/' },
    }));
    vi.doMock('~/shared/composables/use-backend-status', () => ({
      isBackendWakeUpError: () => false,
    }));

    const middleware = (await import('./auth')).default;

    const result = await middleware({} as never, {} as never);

    expect(result).toBeUndefined();
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it('retries in background on backend wake-up errors', async () => {
    const wakeUpError = new Error('wake-up');
    const refetch = vi.fn()
      .mockRejectedValueOnce(wakeUpError)
      .mockResolvedValueOnce({ data: { user: null } });

    vi.doMock('~/shared/server-state/me/current-user.query', () => ({
      useGetCurrentUser: () => ({
        data: { value: { user: null } },
        refetch,
      }),
    }));
    vi.doMock('~/shared/navigation/routes', () => ({
      routes: { home: () => '/' },
    }));
    vi.doMock('~/shared/composables/use-backend-status', () => ({
      isBackendWakeUpError: (error: unknown) => error === wakeUpError,
    }));

    const middleware = (await import('./auth')).default;

    const result = await middleware({} as never, {} as never);

    expect(result).toBeUndefined();
    expect(refetch).toHaveBeenCalledTimes(2);
    expect(refetch).toHaveBeenNthCalledWith(1, { throwOnError: true });
    expect(refetch).toHaveBeenNthCalledWith(2);
    expect(navigateToMock).not.toHaveBeenCalled();
  });
});
