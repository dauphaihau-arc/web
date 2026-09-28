import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

const { mockNavigateTo, mockSetQueryData } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockSetQueryData: vi.fn(),
}));

mockNuxtImport('navigateTo', () => mockNavigateTo);
mockNuxtImport('useQueryClient', () => () => ({ setQueryData: mockSetQueryData }));

vi.mock('~/domains/auth/api/auth.api', () => ({
  authApi: { logout: vi.fn() },
}));

const sellerUser = { id: 'seller-1', roles: ['seller'] };

function mockCurrentUser(initialValue: unknown) {
  const data: { value: unknown } = { value: initialValue };
  const refetch = vi.fn(async () => {
    data.value = { user: sellerUser };

    return { data: data.value };
  });

  vi.doMock('~/domains/me/queries/current-user.query', () => ({
    useGetCurrentUser: () => ({ data, refetch }),
  }));

  return { data, refetch };
}

// The middleware is imported per case so it sees that case's current-user mock.
async function importMiddleware() {
  return (await import('~/app/middleware/guest.global')).default;
}

describe('guest global middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('~/domains/me/queries/current-user.query');
  });

  it('resolves an unknown session before deciding on a session-dependent route', async () => {
    const { refetch } = mockCurrentUser(undefined);

    const middleware = await importMiddleware();
    await middleware({ path: '/login' } as never, {} as never);

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/dashboard' });
  });

  it('redirects an already resolved seller away from the login and register pages', async () => {
    for (const path of ['/login', '/register']) {
      vi.clearAllMocks();
      vi.resetModules();

      const { refetch } = mockCurrentUser({ user: sellerUser });

      const middleware = await importMiddleware();
      await middleware({ path } as never, {} as never);

      expect(refetch).not.toHaveBeenCalled();
      expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/dashboard' });
    }
  });

  it('leaves a resolved guest on the login page without an extra session request', async () => {
    const { refetch } = mockCurrentUser({ user: null });

    const middleware = await importMiddleware();
    await middleware({ path: '/login' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('does not resolve the session on routes that do not depend on it', async () => {
    const { refetch } = mockCurrentUser(undefined);

    const middleware = await importMiddleware();
    await middleware({ path: '/products' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('redirects a seller with access away from the sell onboarding page', async () => {
    const { refetch } = mockCurrentUser({ user: sellerUser });

    const middleware = await importMiddleware();
    await middleware({ path: '/sell' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/dashboard' });
  });
});
