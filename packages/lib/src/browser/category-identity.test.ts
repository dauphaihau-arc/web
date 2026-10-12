import { describe, expect, it, vi } from 'vitest'
import { CATEGORY_IDENTITY_CONTRACT } from '@arc/enums/category'
import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import { SessionStorageKeys } from '@arc/enums/session-storage-keys'
import {
  CategoryIdentityMismatchError,
  CategoryIdentityUnavailableError,
  categoryIdentityQueryPolicy,
  createCategoryIdentityGuard,
  enforceCategoryIdentityContract,
  invalidateCategoryBearingState,
  isCategoryIdentityGenerationMismatchError,
  isCategoryIdentityMismatchError,
  isCategoryIdentityUnavailableError,
} from './category-identity'

const RELOAD_PENDING_KEY = 'category-identity-reload-pending'

function createStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed))

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

function createGuard(options: {
  clientVersion: string
  fetchServerVersion: () => Promise<string | null>
  reload?: () => void
  session?: Storage
}) {
  return createCategoryIdentityGuard({
    clientVersion: options.clientVersion,
    fetchServerVersion: options.fetchServerVersion,
    reload: options.reload ?? vi.fn(),
    stores: { session: options.session ?? createStorage() },
  })
}

describe('invalidateCategoryBearingState', () => {
  it('removes breadcrumb and category user activity while keeping unrelated state', () => {
    const session = createStorage({
      [SessionStorageKeys.CATEGORIES_BREADCRUMB]: JSON.stringify([
        { id: 'internal-uuid', name: 'Old', to: '/c/old' },
      ]),
      [SessionStorageKeys.USER_ACTIVITIES]: JSON.stringify({
        categoryIdProductVisited: 'internal-uuid',
        rootCategoryProductVisited: { id: 'internal-uuid', name: 'Old' },
        subCategoriesLastVisit: [{ id: 'internal-uuid', name: 'Old' }],
        searchHistory: ['mugs'],
      }),
    })
    const local = createStorage({
      [LocalStorageKeys.GUEST_PREFERENCES]: JSON.stringify({ currency: 'USD', language: 'en', region: 'US' }),
      [LocalStorageKeys.RECENT_PRODUCT_VIEWS]: JSON.stringify([
        { product: { id: 'p1', category_id: 'internal-uuid', title: 'Mug' }, viewedAt: '2026-01-01T00:00:00.000Z' },
      ]),
    })

    invalidateCategoryBearingState({ session, local })

    expect(session.getItem(SessionStorageKeys.CATEGORIES_BREADCRUMB)).toBeNull()
    expect(JSON.parse(session.getItem(SessionStorageKeys.USER_ACTIVITIES) ?? '{}')).toEqual({
      searchHistory: ['mugs'],
    })
    expect(local.getItem(LocalStorageKeys.GUEST_PREFERENCES)).toBe(
      JSON.stringify({ currency: 'USD', language: 'en', region: 'US' }),
    )
    // Product history is preserved; only its stale category reference is dropped.
    expect(JSON.parse(local.getItem(LocalStorageKeys.RECENT_PRODUCT_VIEWS) ?? '[]')).toEqual([
      { product: { id: 'p1', title: 'Mug' }, viewedAt: '2026-01-01T00:00:00.000Z' },
    ])
  })
})

describe('enforceCategoryIdentityContract', () => {
  it('stamps the current contract without reloading on a fresh session', () => {
    const session = createStorage()
    const reload = vi.fn()

    expect(enforceCategoryIdentityContract({ session }, reload)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
    expect(session.getItem(CATEGORY_IDENTITY_CONTRACT.STORAGE_KEY)).toBe(
      CATEGORY_IDENTITY_CONTRACT.VERSION,
    )
  })

  it('invalidates category state and reloads when the stored contract is outdated', () => {
    const session = createStorage({
      [CATEGORY_IDENTITY_CONTRACT.STORAGE_KEY]: '1',
      [SessionStorageKeys.CATEGORIES_BREADCRUMB]: JSON.stringify([{ id: 'internal-uuid' }]),
    })
    const local = createStorage({
      [LocalStorageKeys.GUEST_PREFERENCES]: JSON.stringify({ currency: 'USD' }),
    })
    const reload = vi.fn()

    expect(enforceCategoryIdentityContract({ session, local }, reload)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(session.getItem(SessionStorageKeys.CATEGORIES_BREADCRUMB)).toBeNull()
    expect(local.getItem(LocalStorageKeys.GUEST_PREFERENCES)).toBe(JSON.stringify({ currency: 'USD' }))
    expect(session.getItem(CATEGORY_IDENTITY_CONTRACT.STORAGE_KEY)).toBe(
      CATEGORY_IDENTITY_CONTRACT.VERSION,
    )
  })

  it('does nothing when the stored contract already matches', () => {
    const session = createStorage({
      [CATEGORY_IDENTITY_CONTRACT.STORAGE_KEY]: CATEGORY_IDENTITY_CONTRACT.VERSION,
      [SessionStorageKeys.CATEGORIES_BREADCRUMB]: JSON.stringify([{ id: '42' }]),
    })
    const reload = vi.fn()

    expect(enforceCategoryIdentityContract({ session }, reload)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
    expect(session.getItem(SessionStorageKeys.CATEGORIES_BREADCRUMB)).toBe(
      JSON.stringify([{ id: '42' }]),
    )
  })
})

describe('category identity errors', () => {
  it('classifies the typed mismatch error distinctly from a transient failure', () => {
    expect(isCategoryIdentityMismatchError(new CategoryIdentityMismatchError())).toBe(true)
    expect(isCategoryIdentityMismatchError({ code: 'CATEGORY_IDENTITY_MISMATCH' })).toBe(true)
    expect(isCategoryIdentityMismatchError(new CategoryIdentityUnavailableError())).toBe(false)
    expect(isCategoryIdentityMismatchError(new Error('network'))).toBe(false)

    expect(isCategoryIdentityUnavailableError(new CategoryIdentityUnavailableError())).toBe(true)
    expect(isCategoryIdentityUnavailableError(new CategoryIdentityMismatchError())).toBe(false)
  })

  it('reads the raw backend generation code from the body or the response', () => {
    expect(isCategoryIdentityGenerationMismatchError({
      data: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' },
    })).toBe(true)
    expect(isCategoryIdentityGenerationMismatchError({
      response: { data: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' } },
    })).toBe(true)
    expect(isCategoryIdentityGenerationMismatchError({ data: { code: 'OTHER' } })).toBe(false)
    expect(isCategoryIdentityGenerationMismatchError(new Error('network'))).toBe(false)
  })

  it('includes the raw backend generation rejection in the terminal mismatch classification', () => {
    expect(isCategoryIdentityMismatchError({
      response: { status: 409, data: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' } },
    })).toBe(true)
    // An unrelated 409 is not a category identity mismatch.
    expect(isCategoryIdentityMismatchError({
      response: { status: 409, data: { code: 'SLOT_CONFLICT' } },
    })).toBe(false)
  })
})

describe('createCategoryIdentityGuard', () => {
  it('allows requests when the API contract matches the client', async () => {
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion: async () => '2', reload })

    await expect(guard.ensureCompatible()).resolves.toBe('compatible')
    expect(guard.status).toBe('compatible')
    expect(reload).not.toHaveBeenCalled()
  })

  it('latches a confirmed mismatch, reloads once, then blocks without probing again', async () => {
    const session = createStorage({
      [SessionStorageKeys.CATEGORIES_BREADCRUMB]: JSON.stringify([{ id: 'internal-uuid' }]),
      [SessionStorageKeys.USER_ACTIVITIES]: JSON.stringify({ categoryIdProductVisited: 'internal-uuid' }),
    })
    const fetchServerVersion = vi.fn().mockResolvedValue('3')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload, session })

    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(reload).toHaveBeenCalledTimes(1)
    // Only category-bearing state is invalidated.
    expect(session.getItem(SessionStorageKeys.CATEGORIES_BREADCRUMB)).toBeNull()
    expect(session.getItem(SessionStorageKeys.USER_ACTIVITIES)).toBe('{}')
    // The latch is terminal: no further probe, no further reload, no network.
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not latch an unconfirmed probe and keeps it retryable', async () => {
    const fetchServerVersion = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue('2')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload })

    await expect(guard.ensureCompatible()).resolves.toBe('unavailable')
    expect(guard.status).toBe('unavailable')
    expect(reload).not.toHaveBeenCalled()
    await expect(guard.ensureCompatible()).resolves.toBe('compatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(2)
  })

  it('treats a failed probe as transient rather than a terminal mismatch', async () => {
    const fetchServerVersion = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue('2')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload })

    await expect(guard.ensureCompatible()).resolves.toBe('unavailable')
    expect(reload).not.toHaveBeenCalled()
    await expect(guard.ensureCompatible()).resolves.toBe('compatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight probe across concurrent checks and reuses success', async () => {
    let resolveProbe!: (version: string) => void
    const fetchServerVersion = vi.fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => {
        resolveProbe = resolve
      }))
      .mockResolvedValue('3')
    const guard = createGuard({ clientVersion: '2', fetchServerVersion })

    const checks = [guard.ensureCompatible(), guard.ensureCompatible(), guard.ensureCompatible()]
    expect(fetchServerVersion).toHaveBeenCalledTimes(1)
    resolveProbe('2')
    expect(await Promise.all(checks)).toEqual(['compatible', 'compatible', 'compatible'])
    await expect(guard.ensureCompatible()).resolves.toBe('compatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(1)
  })

  it('latches on a backend rejection and blocks without probing', async () => {
    const fetchServerVersion = vi.fn().mockResolvedValue('2')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload })

    guard.handleServerMismatch()

    expect(guard.status).toBe('incompatible')
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(fetchServerVersion).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not let an in-flight probe clear a backend rejection', async () => {
    let resolveProbe!: (version: string) => void
    const fetchServerVersion = vi.fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => {
        resolveProbe = resolve
      }))
      .mockResolvedValue('3')
    const guard = createGuard({ clientVersion: '2', fetchServerVersion })

    const pending = guard.ensureCompatible()
    guard.handleServerMismatch()
    resolveProbe('2')
    await expect(pending).resolves.toBe('incompatible')
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(1)
  })

  it('probes once on a reloaded page and never auto-reloads again', async () => {
    const session = createStorage({ [RELOAD_PENDING_KEY]: '1' })
    const fetchServerVersion = vi.fn().mockResolvedValue('3')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload, session })

    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()
    // Focus / remount / reconnect all call ensureCompatible; the latch holds.
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()
  })

  it('recheck recovers when the API returns a compatible contract and re-arms reload', async () => {
    const session = createStorage({ [RELOAD_PENDING_KEY]: '1' })
    const fetchServerVersion = vi.fn()
      .mockResolvedValueOnce('3')
      .mockResolvedValue('2')
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, session })

    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    await expect(guard.recheck()).resolves.toBe('compatible')
    // The one-shot reload is re-armed so a corrected client is never wedged.
    expect(session.getItem(RELOAD_PENDING_KEY)).toBeNull()
    await expect(guard.ensureCompatible()).resolves.toBe('compatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(2)
  })

  it('recheck on a still-blocked page issues exactly one explicit reload', async () => {
    const session = createStorage({ [RELOAD_PENDING_KEY]: '1' })
    const fetchServerVersion = vi.fn().mockResolvedValue('3')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload, session })

    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(reload).not.toHaveBeenCalled()

    await expect(guard.recheck()).resolves.toBe('incompatible')
    expect(reload).toHaveBeenCalledTimes(1)
    // The automatic marker survives a manual reload, so the reloaded page will
    // not auto-reload again while the mismatch persists.
    expect(session.getItem(RELOAD_PENDING_KEY)).toBe('1')
  })

  it('keeps a confirmed mismatch blocked when a manual check is unavailable', async () => {
    const session = createStorage({ [RELOAD_PENDING_KEY]: '1' })
    const fetchServerVersion = vi.fn()
      .mockResolvedValueOnce('3')
      .mockRejectedValueOnce(new Error('Offline'))
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, session, reload })

    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    await expect(guard.recheck()).resolves.toBe('incompatible')
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    expect(fetchServerVersion).toHaveBeenCalledTimes(2)
    expect(reload).not.toHaveBeenCalled()
  })

  it('does not re-arm the reload on a bare probe confirmation', async () => {
    const session = createStorage({ [RELOAD_PENDING_KEY]: '1' })
    const fetchServerVersion = vi.fn().mockResolvedValue('2')
    const reload = vi.fn()
    const guard = createGuard({ clientVersion: '2', fetchServerVersion, reload, session })

    await expect(guard.ensureCompatible()).resolves.toBe('compatible')
    // A compatible probe followed by a backend rejection must not loop: the
    // marker stays set, so the rejection cannot trigger another reload.
    expect(session.getItem(RELOAD_PENDING_KEY)).toBe('1')

    guard.handleServerMismatch()
    expect(reload).not.toHaveBeenCalled()
    expect(guard.status).toBe('incompatible')
  })

  it('notifies subscribers on every status transition', async () => {
    const fetchServerVersion = vi.fn().mockResolvedValue('3')
    const guard = createGuard({ clientVersion: '2', fetchServerVersion })
    const transitions: string[] = []
    guard.subscribe(next => transitions.push(next))

    await guard.ensureCompatible()
    guard.handleServerMismatch()

    expect(transitions).toEqual(['incompatible'])
  })

  it('never adopts the server generation', async () => {
    const guard = createGuard({ clientVersion: '2', fetchServerVersion: async () => '3' })

    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
    await expect(guard.ensureCompatible()).resolves.toBe('incompatible')
  })
})

describe('categoryIdentityQueryPolicy', () => {
  it('disables retries and refetch for a terminal mismatch only', () => {
    const policy = categoryIdentityQueryPolicy()
    const mismatch = new CategoryIdentityMismatchError()
    const transient = new CategoryIdentityUnavailableError()

    expect(policy.retry(0, mismatch)).toBe(false)
    expect(policy.retry(0, transient)).toBe(true)
    expect(policy.retry(3, transient)).toBe(false)
    expect(policy.refetchOnMount({ state: { error: mismatch } })).toBe(false)
    expect(policy.refetchOnWindowFocus({ state: { error: mismatch } })).toBe(false)
    expect(policy.refetchOnReconnect({ state: { error: mismatch } })).toBe(false)
    expect(policy.refetchOnMount({ state: { error: transient } })).toBe('always')
    expect(policy.refetchOnWindowFocus({ state: { error: transient } })).toBe(true)
  })

  it('treats a raw backend generation 409 as terminal but keeps other failures retryable', () => {
    const policy = categoryIdentityQueryPolicy()
    const backendMismatch = { response: { status: 409, data: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' } } }
    const unrelatedConflict = { response: { status: 409, data: { code: 'SLOT_CONFLICT' } } }
    const networkFailure = new Error('network')

    expect(policy.retry(0, backendMismatch)).toBe(false)
    expect(policy.refetchOnWindowFocus({ state: { error: backendMismatch } })).toBe(false)
    expect(policy.refetchOnReconnect({ state: { error: backendMismatch } })).toBe(false)
    expect(policy.refetchOnMount({ state: { error: backendMismatch } })).toBe(false)

    expect(policy.retry(0, unrelatedConflict)).toBe(true)
    expect(policy.retry(0, networkFailure)).toBe(true)
    expect(policy.refetchOnWindowFocus({ state: { error: unrelatedConflict } })).toBe(true)
    expect(policy.refetchOnReconnect({ state: { error: networkFailure } })).toBe(true)
  })
})
