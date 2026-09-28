import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
}));

mockNuxtImport('navigateTo', () => mockNavigateTo);

const customerUser = { id: 'customer-1', roles: ['customer'] };

type RefetchOutcome = { data: unknown } | { error: unknown };

function mockCurrentUser(initialValue: unknown, outcome: RefetchOutcome = { data: { user: null } }) {
  const data: { value: unknown } = { value: initialValue };
  const refetch = vi.fn(async () => {
    if ('error' in outcome) {
      throw outcome.error;
    }

    data.value = outcome.data;

    return { data: data.value };
  });

  vi.doMock('~/domains/me/queries/current-user.query', () => ({
    useGetCurrentUser: () => ({ data, refetch }),
  }));

  return { data, refetch };
}

// The middleware is imported per case so it sees that case's current-user mock.
async function importMiddleware() {
  return (await import('~/app/middleware/onboarding')).default;
}

const sellRoute = { path: '/sell', fullPath: '/sell' } as never;

describe('onboarding middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('~/domains/me/queries/current-user.query');
  });

  it('redirects a resolved guest to login without another session request', async () => {
    const { refetch } = mockCurrentUser({ user: null });
    const middleware = await importMiddleware();

    await middleware(sellRoute, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/sell' } });
  });

  it('leaves a signed-in user without seller access on the onboarding page', async () => {
    const { refetch } = mockCurrentUser({ user: customerUser });
    const middleware = await importMiddleware();

    await middleware(sellRoute, {} as never);

    expect(refetch).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('resolves an unknown session before deciding', async () => {
    const { refetch } = mockCurrentUser(undefined, { data: { user: customerUser } });
    const middleware = await importMiddleware();

    await middleware(sellRoute, {} as never);

    expect(refetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('redirects to login when the session probe resolves a guest', async () => {
    mockCurrentUser(undefined, { data: { user: null } });
    const middleware = await importMiddleware();

    await middleware(sellRoute, {} as never);

    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/sell' } });
  });

  it('keeps rendering the page while the backend wakes up', async () => {
    const { refetch } = mockCurrentUser(undefined, { error: new Error('network down') });
    const middleware = await importMiddleware();

    await middleware(sellRoute, {} as never);

    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('redirects to login when the session probe fails for another reason', async () => {
    mockCurrentUser(undefined, { error: Object.assign(new Error('server error'), { statusCode: 500 }) });
    const middleware = await importMiddleware();

    await middleware(sellRoute, {} as never);

    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/sell' } });
  });
});
