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

const adminUser = { id: 'admin-1', roles: ['admin'] };
const superAdminUser = { id: 'super-admin-1', roles: ['super_admin'] };
const sellerUser = { id: 'seller-1', roles: ['seller'] };

function mockCurrentUser(initialValue: unknown, resolvedUser: unknown = null) {
  const data: { value: unknown } = { value: initialValue };
  const refetch = vi.fn(async () => {
    data.value = { user: resolvedUser };

    return { data: data.value };
  });

  vi.doMock('~/domains/me/queries/current-user.query', () => ({
    useGetCurrentUser: () => ({ data, refetch }),
  }));

  return { data, refetch };
}

// The middleware is imported per case so it sees that case's current-user mock.
async function importMiddleware() {
  return (await import('~/app/middleware/auth')).default;
}

describe('admin auth route middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('~/domains/me/queries/current-user.query');
  });

  it('lets a resolved admin session through', async () => {
    const { refetch } = mockCurrentUser({ user: adminUser });

    const middleware = await importMiddleware();
    await middleware({ fullPath: '/orders' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('lets a resolved super_admin session through', async () => {
    const { refetch } = mockCurrentUser({ user: superAdminUser });

    const middleware = await importMiddleware();
    await middleware({ fullPath: '/users' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('lets a session that resolves to admin through after refetching', async () => {
    const { refetch } = mockCurrentUser({ user: sellerUser }, adminUser);

    const middleware = await importMiddleware();
    await middleware({ fullPath: '/orders' } as never, {} as never);

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('redirects a resolved non-admin session to login preserving the full path', async () => {
    const { refetch } = mockCurrentUser({ user: sellerUser }, sellerUser);

    const middleware = await importMiddleware();
    await middleware({ fullPath: '/orders/ord_123?tab=refund' } as never, {} as never);

    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockSetQueryData).toHaveBeenCalledWith(['current-user'], { user: null });
    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/orders/ord_123?tab=refund' },
    });
  });

  it('redirects a resolved guest session to login preserving the full path', async () => {
    const { refetch } = mockCurrentUser({ user: null }, null);

    const middleware = await importMiddleware();
    await middleware({ fullPath: '/orders/ord_123' } as never, {} as never);

    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockSetQueryData).toHaveBeenCalledWith(['current-user'], { user: null });
    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/orders/ord_123' },
    });
  });

  it('redirects an unknown session that resolves to a guest', async () => {
    const { refetch } = mockCurrentUser(undefined, null);

    const middleware = await importMiddleware();
    await middleware({ fullPath: '/users' } as never, {} as never);

    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockSetQueryData).toHaveBeenCalledWith(['current-user'], { user: null });
    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/users' },
    });
  });
});
