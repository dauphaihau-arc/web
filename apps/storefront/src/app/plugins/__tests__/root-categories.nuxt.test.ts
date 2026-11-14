import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

const {
  useMarketStoreMock,
  getRequestMarketHeadersMock,
  fetchRootCategoriesMock,
  logMock,
} = vi.hoisted(() => ({
  useMarketStoreMock: vi.fn(),
  getRequestMarketHeadersMock: vi.fn(),
  fetchRootCategoriesMock: vi.fn(),
  logMock: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@arc/lib', async importOriginal => ({
  ...(await importOriginal<typeof import('@arc/lib')>()),
  log: logMock,
}));

vi.mock('~/domains/category/queries/categories.query', async importOriginal => ({
  ...(await importOriginal<typeof import('~/domains/category/queries/categories.query')>()),
  fetchRootCategories: fetchRootCategoriesMock,
}));

vi.mock('~/domains/market/stores/market.store', () => ({
  useMarketStore: useMarketStoreMock,
}));

vi.mock('~/domains/market/stores/request-market-context', () => ({
  getRequestMarketHeaders: getRequestMarketHeadersMock,
}));

const US_HEADERS = {
  'X-Market-Code': 'US',
  'X-Currency': 'USD',
  'X-Locale': 'en-US',
  'X-Channel': 'WEB',
};

const CATEGORIES = [
  { id: '1', name: 'Fashion' },
  { id: '2', name: 'Art' },
];

function createQueryClient(fetchQuery = vi.fn().mockResolvedValue(CATEGORIES)) {
  return {
    queryClient: { fetchQuery, setQueryData: vi.fn() },
    fetchQuery,
  };
}

describe('root-categories prefetch', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    useMarketStoreMock.mockReturnValue({
      isMarketReady: true,
      ensureMarketReady: vi.fn().mockResolvedValue(undefined),
    });
    fetchRootCategoriesMock.mockReturnValue(new Promise(() => {}));
  });

  it('seeds the request query client with the fetched categories', async () => {
    getRequestMarketHeadersMock.mockReturnValue(US_HEADERS);
    const { prefetchRootCategories } = await import('../root-categories');
    const { queryClient, fetchQuery } = createQueryClient();

    await prefetchRootCategories(queryClient as never);

    expect(fetchQuery).toHaveBeenCalledTimes(1);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ['get-root-categories'],
      CATEGORIES,
    );
    expect(logMock.info).toHaveBeenCalledWith(
      '[root-categories][SSR] fetched',
      expect.objectContaining({ market: 'US/en-US', count: 2 }),
    );
  });

  it('serves later requests from the process cache instead of refetching', async () => {
    getRequestMarketHeadersMock.mockReturnValue(US_HEADERS);
    const { prefetchRootCategories } = await import('../root-categories');
    const first = createQueryClient();

    await prefetchRootCategories(first.queryClient as never);

    const second = createQueryClient();
    await prefetchRootCategories(second.queryClient as never);

    expect(second.fetchQuery).not.toHaveBeenCalled();
    expect(second.queryClient.setQueryData).toHaveBeenCalledWith(
      ['get-root-categories'],
      CATEGORIES,
    );
    expect(logMock.debug).toHaveBeenCalledWith(
      '[root-categories][SSR] cache hit',
      expect.objectContaining({ market: 'US/en-US', count: 2 }),
    );
  });

  it('keeps one cache entry per market', async () => {
    const { prefetchRootCategories } = await import('../root-categories');
    const us = createQueryClient();
    const vn = createQueryClient();

    getRequestMarketHeadersMock.mockReturnValue(US_HEADERS);
    await prefetchRootCategories(us.queryClient as never);

    getRequestMarketHeadersMock.mockReturnValue({
      ...US_HEADERS,
      'X-Market-Code': 'VN',
      'X-Currency': 'VND',
      'X-Locale': 'vi-VN',
    });
    await prefetchRootCategories(vn.queryClient as never);

    expect(us.fetchQuery).toHaveBeenCalledTimes(1);
    expect(vn.fetchQuery).toHaveBeenCalledTimes(1);
  });

  it('refetches once the cached list goes stale', async () => {
    vi.useFakeTimers();
    getRequestMarketHeadersMock.mockReturnValue({ ...US_HEADERS, 'X-Locale': 'en-US-ttl' });

    try {
      const { prefetchRootCategories } = await import('../root-categories');
      const first = createQueryClient();

      await prefetchRootCategories(first.queryClient as never);
      vi.advanceTimersByTime(60_001);

      const second = createQueryClient();
      await prefetchRootCategories(second.queryClient as never);

      expect(first.fetchQuery).toHaveBeenCalledTimes(1);
      expect(second.fetchQuery).toHaveBeenCalledTimes(1);
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('gives up waiting on a hung fetch and leaves the header on placeholders', async () => {
    getRequestMarketHeadersMock.mockReturnValue({ ...US_HEADERS, 'X-Locale': 'en-US-hang' });
    const { prefetchRootCategories } = await import('../root-categories');
    const { queryClient } = createQueryClient(vi.fn(() => new Promise(() => {})) as never);

    await expect(
      prefetchRootCategories(queryClient as never, { waitBudgetMs: 10 }),
    ).resolves.toBeUndefined();

    expect(queryClient.setQueryData).not.toHaveBeenCalled();
    expect(logMock.warn).toHaveBeenCalledWith(
      '[root-categories][SSR] wait budget exceeded, aborting fetch and rendering placeholders',
      { market: 'US/en-US-hang', waitedMs: expect.any(Number) },
    );
  });

  it('skips the prefetch when the market is not resolved yet', async () => {
    useMarketStoreMock.mockReturnValue({
      isMarketReady: false,
      ensureMarketReady: vi.fn().mockResolvedValue(undefined),
    });
    const { prefetchRootCategories } = await import('../root-categories');
    const { queryClient, fetchQuery } = createQueryClient();

    await prefetchRootCategories(queryClient as never);

    expect(fetchQuery).not.toHaveBeenCalled();
    expect(queryClient.setQueryData).not.toHaveBeenCalled();
    expect(logMock.info).toHaveBeenCalledWith(
      '[root-categories][SSR] market not ready, skipping prefetch',
    );
  });

  it('aborts the request when the render budget expires so nothing runs past the request', async () => {
    getRequestMarketHeadersMock.mockReturnValue({ ...US_HEADERS, 'X-Locale': 'en-US-abort' });
    const { prefetchRootCategories } = await import('../root-categories');
    const fetchQuery = vi.fn((options: { queryFn: () => Promise<unknown> }) => options.queryFn());
    const { queryClient } = createQueryClient(fetchQuery as never);

    await prefetchRootCategories(queryClient as never, { waitBudgetMs: 10 });

    expect(fetchQuery).toHaveBeenCalledWith(expect.objectContaining({ retry: false }));
    expect(fetchRootCategoriesMock).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
      retryOnWakeUp: false,
    });
    expect(fetchRootCategoriesMock.mock.calls[0]![0].signal.aborted).toBe(true);
    expect(logMock.error).not.toHaveBeenCalled();
  });

  it('logs a failed fetch and does not seed the request', async () => {
    getRequestMarketHeadersMock.mockReturnValue({ ...US_HEADERS, 'X-Locale': 'en-US-fail' });
    const { prefetchRootCategories } = await import('../root-categories');
    const failure = new Error('categories unavailable');
    const { queryClient } = createQueryClient(vi.fn().mockRejectedValue(failure) as never);

    await prefetchRootCategories(queryClient as never);

    expect(queryClient.setQueryData).not.toHaveBeenCalled();
    expect(logMock.error).toHaveBeenCalledWith(
      '[root-categories][SSR] fetch failed',
      { market: 'US/en-US-fail', error: failure },
    );
  });
});
