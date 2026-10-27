import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

const { mockNavigateTo, mockSetQueryData, mockLogout } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockSetQueryData: vi.fn(),
  mockLogout: vi.fn(),
}));

mockNuxtImport('navigateTo', () => mockNavigateTo);
mockNuxtImport('useQueryClient', () => () => ({ setQueryData: mockSetQueryData }));

// The middleware deliberately never logs out a session from another portal;
// this mock makes that regression observable.
vi.mock('~/domains/auth/api/auth.api', () => ({
  authApi: { logout: mockLogout },
}));

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
  return (await import('~/app/middleware/guest.global')).default;
}

describe('admin guest global middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('~/domains/me/queries/current-user.query');
  });

  it('sends an admin session on the login page to the shops list without logging out', async () => {
    const { refetch } = mockCurrentUser({ user: adminUser });

    const middleware = await importMiddleware();
    await middleware({ path: '/login' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/shops' });
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('sends a super_admin session on the login page to the shops list without logging out', async () => {
    const { refetch } = mockCurrentUser({ user: superAdminUser });

    const middleware = await importMiddleware();
    await middleware({ path: '/login' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/shops' });
    expect(mockSetQueryData).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('drops a seller session that reaches an admin route without logging it out', async () => {
    const { refetch } = mockCurrentUser({ user: sellerUser });

    const middleware = await importMiddleware();
    await middleware({ path: '/orders' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockSetQueryData).toHaveBeenCalledWith(['current-user'], { user: null });
    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/login' });
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('resolves an unknown session on the login page exactly once', async () => {
    const { refetch } = mockCurrentUser(undefined, null);

    const middleware = await importMiddleware();
    await middleware({ path: '/login' } as never, {} as never);

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('leaves a resolved guest on the login page without another session request', async () => {
    const { refetch } = mockCurrentUser({ user: null });

    const middleware = await importMiddleware();
    await middleware({ path: '/login' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(mockSetQueryData).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('does not resolve the session on routes that do not depend on it', async () => {
    const { refetch } = mockCurrentUser(undefined);

    const middleware = await importMiddleware();
    await middleware({ path: '/orders' } as never, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });
});
