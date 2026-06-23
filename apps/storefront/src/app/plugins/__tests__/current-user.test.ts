import {
  beforeEach, describe, expect, it, vi,
} from 'vitest'

const {
  defineNuxtPluginMock,
  useMarketStoreMock,
  useQueryClientMock,
} = vi.hoisted(() => ({
  defineNuxtPluginMock: vi.fn((plugin: unknown) => plugin),
  useMarketStoreMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}))

vi.mock('#app', () => ({
  defineNuxtPlugin: defineNuxtPluginMock,
}))

vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/vue-query')>('@tanstack/vue-query')

  return {
    ...actual,
    useQueryClient: useQueryClientMock,
  }
})

vi.mock('~/shared/stores/market/market.store', () => ({
  useMarketStore: useMarketStoreMock,
}))

describe('current-user plugin', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('bootstraps current user and market store on app start', async () => {
    const queryClient = {
      fetchQuery: vi.fn().mockResolvedValue({ user: null }),
      prefetchQuery: vi.fn().mockResolvedValue(undefined),
    }
    const ensureMarketReady = vi.fn().mockResolvedValue(undefined)

    useQueryClientMock.mockReturnValue(queryClient)
    useMarketStoreMock.mockReturnValue({ ensureMarketReady })

    const plugin = (await import('../current-user')).default

    await plugin({} as never)

    expect(queryClient.fetchQuery).toHaveBeenCalledTimes(1)
    expect(queryClient.fetchQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['current-user'],
      staleTime: 0,
    }))
    expect(queryClient.prefetchQuery).not.toHaveBeenCalled()
    expect(ensureMarketReady).toHaveBeenCalledTimes(1)
  })
})
