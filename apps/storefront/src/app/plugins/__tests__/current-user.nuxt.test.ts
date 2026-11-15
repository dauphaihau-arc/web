import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

const {
  defineNuxtPluginMock,
  useMarketStoreMock,
  useQueryClientMock,
} = vi.hoisted(() => ({
  defineNuxtPluginMock: vi.fn((plugin: unknown) => plugin),
  useMarketStoreMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}));

vi.mock('#app', () => ({
  defineNuxtPlugin: defineNuxtPluginMock,
}));

vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/vue-query')>('@tanstack/vue-query');

  return {
    ...actual,
    useQueryClient: useQueryClientMock,
  };
});

vi.mock('~/domains/market/stores/market.store', () => ({
  useMarketStore: useMarketStoreMock,
}));

describe('current-user plugin', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('bootstraps current user and market store on app start', async () => {
    const queryClient = {
      query: vi.fn().mockResolvedValue({ user: null }),
    };
    const ensureMarketReady = vi.fn().mockResolvedValue(undefined);

    useQueryClientMock.mockReturnValue(queryClient);
    useMarketStoreMock.mockReturnValue({ ensureMarketReady });

    const plugin = (await import('../current-user')).default;

    await plugin({} as never);

    expect(queryClient.query).toHaveBeenCalledTimes(1);
    expect(queryClient.query).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['current-user'],
      staleTime: 0,
    }));
    expect(ensureMarketReady).toHaveBeenCalledTimes(1);
  });
});
