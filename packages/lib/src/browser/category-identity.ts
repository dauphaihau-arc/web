import {
  CATEGORY_BEARING_ACTIVITY_KEYS,
  CATEGORY_IDENTITY_CONTRACT,
} from '@arc/enums/category'
import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import { SessionStorageKeys } from '@arc/enums/session-storage-keys'

export type CategoryStateStores = {
  session: Storage
  local?: Storage
}

function parseJsonRecord(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  }
  catch {
    return null
  }
}

/**
 * Invalidate only category-bearing persisted state. Shopper preferences and
 * unrelated session values are preserved; cached product snapshots keep their
 * product history but drop their category reference, which was recorded under
 * the old identity semantics.
 */
export function invalidateCategoryBearingState(stores: CategoryStateStores): void {
  stores.session.removeItem(SessionStorageKeys.CATEGORIES_BREADCRUMB)

  const activities = parseJsonRecord(stores.session.getItem(SessionStorageKeys.USER_ACTIVITIES))

  if (activities) {
    for (const key of CATEGORY_BEARING_ACTIVITY_KEYS) {
      delete activities[key]
    }

    stores.session.setItem(SessionStorageKeys.USER_ACTIVITIES, JSON.stringify(activities))
  }

  if (!stores.local) {
    return
  }

  const rawViews = stores.local.getItem(LocalStorageKeys.RECENT_PRODUCT_VIEWS)

  if (!rawViews) {
    return
  }

  try {
    const views = JSON.parse(rawViews) as unknown

    if (!Array.isArray(views)) {
      return
    }

    const sanitized = views.map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return entry
      }

      const record = entry as { product?: Record<string, unknown> }

      if (!record.product || typeof record.product !== 'object') {
        return entry
      }

      const { category_id: _categoryId, ...product } = record.product

      return { ...record, product }
    })

    stores.local.setItem(LocalStorageKeys.RECENT_PRODUCT_VIEWS, JSON.stringify(sanitized))
  }
  catch {
    // Unparseable product history carries no usable category reference.
  }
}

/**
 * Enforce the category identity contract version for persisted browser state.
 *
 * A stored version that differs from the current contract means the client was
 * last used under an older category identifier semantics. Category-bearing
 * state is invalidated and the page is reloaded so no request is issued with
 * stale identity. Returns true when a reload was triggered.
 */
export function enforceCategoryIdentityContract(
  stores: CategoryStateStores,
  reload: () => void,
): boolean {
  const storedVersion = stores.session.getItem(CATEGORY_IDENTITY_CONTRACT.STORAGE_KEY)

  if (storedVersion === CATEGORY_IDENTITY_CONTRACT.VERSION) {
    return false
  }

  invalidateCategoryBearingState(stores)

  stores.session.setItem(
    CATEGORY_IDENTITY_CONTRACT.STORAGE_KEY,
    CATEGORY_IDENTITY_CONTRACT.VERSION,
  )

  if (storedVersion) {
    reload()
    return true
  }

  return false
}

/**
 * True when a request path carries or resolves category identity, i.e. the
 * requests a mismatched client must not send. Mirrors the backend generation
 * gate: `/categories*` (except the probe), `/products`, `/products/facets`, and
 * `/shops/:id/products*`. Unrelated nested product routes (inventory SSE,
 * detail, reviews, review images, suggestions, recommendations) are exempt.
 */
export function isCategoryBearingApiPath(url: string): boolean {
  const path = url.split('?')[0] ?? url

  if (path === '/categories/contract') {
    return false
  }

  if (path === '/categories' || path.startsWith('/categories/')) {
    return true
  }

  if (path === '/products' || path === '/products/facets') {
    return true
  }

  return /^\/shops\/[^/]+\/products(\/|$)/.test(path)
}

/** Stable code carried by {@link CategoryIdentityMismatchError}. */
export const CATEGORY_IDENTITY_MISMATCH_CODE = 'CATEGORY_IDENTITY_MISMATCH'
/** Stable code carried by {@link CategoryIdentityUnavailableError}. */
export const CATEGORY_IDENTITY_UNAVAILABLE_CODE = 'CATEGORY_IDENTITY_UNAVAILABLE'

/**
 * Stable code the API returns (HTTP 409) when a request carries an outdated
 * category identity generation. Unlike {@link CategoryIdentityMismatchError}
 * this is the raw backend response body, not a client-thrown typed error; the
 * two are classified as terminal by the same predicate below.
 */
export const CATEGORY_IDENTITY_GENERATION_MISMATCH_CODE = 'CATEGORY_IDENTITY_GENERATION_MISMATCH'

/**
 * Confirmed category identity incompatibility: the client bundle and the API
 * speak different contract generations. Unlike a transient failure this is
 * terminal for the running app instance — category-bearing requests stay
 * blocked until the app is updated (or the API is rolled back and a manual
 * re-check confirms compatibility).
 */
export class CategoryIdentityMismatchError extends Error {
  readonly code = CATEGORY_IDENTITY_MISMATCH_CODE

  constructor(message = 'Category identity is outdated; reload required') {
    super(message)
    this.name = 'CategoryIdentityMismatchError'
  }
}

/**
 * The contract could not be confirmed (network failure, timeout, or an
 * unconfirmed probe). This is transient: the request may be retried rather than
 * being treated as an incompatibility.
 */
export class CategoryIdentityUnavailableError extends Error {
  readonly code = CATEGORY_IDENTITY_UNAVAILABLE_CODE
  readonly reason: unknown

  constructor(message = 'Category identity contract could not be confirmed', reason?: unknown) {
    super(message)
    this.name = 'CategoryIdentityUnavailableError'
    this.reason = reason
  }
}

export function isCategoryIdentityMismatchError(error: unknown): boolean {
  return error instanceof CategoryIdentityMismatchError
    || (error as { code?: unknown } | null)?.code === CATEGORY_IDENTITY_MISMATCH_CODE
    || isCategoryIdentityGenerationMismatchError(error)
}

/**
 * True when a backend rejection carries the raw category identity generation
 * mismatch code — a 409 from the API generation gate — read from either the
 * parsed body (`error.data.code`) or the response (`error.response.data.code`).
 *
 * A generation incompatibility is terminal for the running app instance even
 * before the client wraps it in {@link CategoryIdentityMismatchError}, so the
 * guard and query policy treat this code as terminal too. Unrelated 409s (any
 * other code, or a reachable network failure) are deliberately not matched.
 */
export function isCategoryIdentityGenerationMismatchError(error: unknown): boolean {
  const candidate = error as {
    data?: { code?: unknown }
    response?: { data?: { code?: unknown } }
  } | null

  const code = candidate?.data?.code ?? candidate?.response?.data?.code

  return code === CATEGORY_IDENTITY_GENERATION_MISMATCH_CODE
}

export function isCategoryIdentityUnavailableError(error: unknown): boolean {
  return error instanceof CategoryIdentityUnavailableError
    || (error as { code?: unknown } | null)?.code === CATEGORY_IDENTITY_UNAVAILABLE_CODE
}

/**
 * Compatibility state of the running app instance.
 *
 * - `compatible`: the API advertised the client's generation; requests proceed.
 * - `incompatible`: a confirmed generation mismatch was observed (probe or
 *   backend rejection). Category-bearing requests are blocked without further
 *   probing until the app is updated.
 * - `unavailable`: the generation is not yet confirmed (initial state, a failed
 *   probe, or a re-check in flight). Treated as retryable, never latched.
 */
export type CategoryIdentityStatus = 'compatible' | 'incompatible' | 'unavailable'

export type CategoryIdentityStatusListener = (status: CategoryIdentityStatus) => void

const RELOAD_PENDING_KEY = 'category-identity-reload-pending'

export type CategoryIdentityGuardOptions = {
  /** Contract version the running client bundle speaks. */
  clientVersion: string

  /** Cheap probe for the version the API currently speaks. */
  fetchServerVersion: () => Promise<string | null>
  reload: () => void
  stores: CategoryStateStores

  /** Storage for the reload guard; defaults to the session store. */
  cache?: Storage
}

export type CategoryIdentityGuard = {
  /** Latched status for this app instance; read synchronously. */
  readonly status: CategoryIdentityStatus

  /**
   * Ensure category-bearing requests may proceed. Once a status is latched
   * (`compatible` or `incompatible`) this is synchronous and never touches the
   * network. A fresh or `unavailable` guard runs one shared probe.
   */
  ensureCompatible: () => Promise<CategoryIdentityStatus>

  /**
   * Explicit user-triggered re-check from the blocked surface. Always probes,
   * bypassing the latched result, and is deduplicated with any in-flight probe.
   */
  recheck: () => Promise<CategoryIdentityStatus>

  /** Handle a backend rejection of this client's generation. */
  handleServerMismatch: () => void

  /** Observe status transitions (for reactive UI). Returns an unsubscribe. */
  subscribe: (listener: CategoryIdentityStatusListener) => () => void
}

/**
 * Pre-cutover compatibility guard for internal-semantic clients.
 *
 * The first category-bearing request probes the API's advertised contract;
 * concurrent requests share that probe. A successful confirmation is reused in
 * memory for this guard instance. A **confirmed** mismatch — either a probe
 * that observes a different generation, or a backend rejection of our
 * generation header — latches `incompatible` for this app instance: every
 * subsequent category-bearing request is rejected immediately, with no probe
 * and no network. A probe that merely cannot confirm (network failure,
 * timeout) is transient, stays `unavailable`, and is retried, never latched.
 *
 * A confirmed mismatch reloads the page **at most once** per browser session
 * (guarded by a session marker) so a still-stale bundle cannot loop. The
 * client never adopts the server's generation. Only an explicit re-check that
 * confirms compatibility clears the marker; a background probe must not re-arm
 * a compatible-probe/backend-rejection reload loop.
 */
export function createCategoryIdentityGuard(
  options: CategoryIdentityGuardOptions,
): CategoryIdentityGuard {
  const cache = options.cache ?? options.stores.session
  const listeners = new Set<CategoryIdentityStatusListener>()

  let status: CategoryIdentityStatus = 'unavailable'
  let pendingProbe: Promise<CategoryIdentityStatus> | undefined
  let generationRevision = 0

  function setStatus(next: CategoryIdentityStatus) {
    if (status === next) {
      return
    }

    status = next

    for (const listener of [...listeners]) {
      listener(next)
    }
  }

  /**
   * Reload the page to fetch a newer bundle, at most once per browser session.
   * The marker is set before reloading so the reloaded page does not reload
   * again while the mismatch persists.
   */
  function automaticReloadOnce() {
    if (cache.getItem(RELOAD_PENDING_KEY)) {
      return
    }

    invalidateCategoryBearingState(options.stores)
    cache.setItem(RELOAD_PENDING_KEY, '1')
    options.reload()
  }

  async function probeCompatibility(): Promise<CategoryIdentityStatus> {
    const revision = generationRevision
    let serverVersion: string | null

    try {
      serverVersion = await options.fetchServerVersion()
    }
    catch {
      serverVersion = null
    }

    // A backend rejection arrived while this probe was in flight; that decision
    // is authoritative, so do not let this stale probe overwrite it.
    if (revision !== generationRevision) {
      return status
    }

    if (!serverVersion) {
      // A failed check cannot disprove an already-confirmed mismatch. Only an
      // initially unconfirmed generation remains transient and retryable.
      if (status !== 'incompatible') {
        setStatus('unavailable')
      }
      return 'unavailable'
    }

    if (serverVersion === options.clientVersion) {
      setStatus('compatible')
      return status
    }

    // Confirmed mismatch: latch and reload at most once. Never adopt the
    // server's generation — the client keeps speaking its own bundle version.
    setStatus('incompatible')
    automaticReloadOnce()
    return status
  }

  function runProbe(): Promise<CategoryIdentityStatus> {
    pendingProbe ??= probeCompatibility().finally(() => {
      pendingProbe = undefined
    })

    return pendingProbe
  }

  function ensureCompatible(): Promise<CategoryIdentityStatus> {
    if (status === 'compatible' || status === 'incompatible') {
      return Promise.resolve(status)
    }

    return runProbe()
  }

  /**
   * Explicit user-triggered re-check. Probes even from a latched mismatch so a
   * rolled-back API or a newly deployed bundle can recover. If the probe
   * confirms the mismatch is still present on an already-blocked page, issue
   * one explicit reload to pick up a newer bundle: the automatic marker is
   * preserved, so the reloaded page will not auto-reload again.
   */
  async function recheck(): Promise<CategoryIdentityStatus> {
    const wasLatched = status === 'incompatible'
    const result = await runProbe()

    if (result === 'compatible') {
      // An explicit user re-check that reconfirms the generation re-arms the
      // one-shot reload for a future mismatch — a corrected client is never
      // wedged. (A background probe does not: a compatible probe followed by a
      // backend rejection must not loop.)
      cache.removeItem(RELOAD_PENDING_KEY)
    }
    else if (wasLatched && result === 'incompatible') {
      // Still blocked: one explicit reload to pick up a newer bundle. The
      // automatic marker is preserved so the reloaded page will not auto-reload.
      options.reload()
    }

    return status
  }

  function handleServerMismatch(): void {
    // Invalidate any probe still in flight so its (possibly compatible) result
    // cannot clear the latch.
    generationRevision += 1
    setStatus('incompatible')
    automaticReloadOnce()
  }

  return {
    get status() {
      return status
    },
    ensureCompatible,
    recheck,
    handleServerMismatch,
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * Query policy for category-bearing queries. Spread these options **after**
 * any other query options so a caller's `retry`/`refetchOn*` cannot re-enable
 * automatic retries or refetches while the category identity is incompatible.
 */
const shouldRetry = (failureCount: number, error: unknown) =>
  !isCategoryIdentityMismatchError(error) && failureCount < 3

const shouldRefetch = (query: { state: { error: unknown } }) =>
  !isCategoryIdentityMismatchError(query.state.error)

/**
 * Query policy for category-bearing queries. Spread these options **after**
 * any other query options so a caller's `retry`/`refetchOn*` cannot re-enable
 * automatic retries or refetches while the category identity is incompatible.
 * `refetchOnMount` stays `'always'` while compatible so the guard actually runs
 * on the client even when SSR-dehydrated data is still fresh.
 */
export function categoryIdentityQueryPolicy() {
  return {
    retry: shouldRetry,
    refetchOnWindowFocus: shouldRefetch,
    refetchOnReconnect: shouldRefetch,
    refetchOnMount: (query: { state: { error: unknown } }) =>
      isCategoryIdentityMismatchError(query.state.error) ? false : 'always',
  }
}

/** Minimal structural view of a TanStack QueryClient; keeps this package framework-free. */
export type CategoryIdentityQueryClient = {
  getDefaultOptions: () => { queries?: Record<string, unknown> } & Record<string, unknown>
  setDefaultOptions: (options: Record<string, unknown>) => void
}

/**
 * Apply the category identity retry/refetch policy as query-client defaults so
 * category queries without their own options inherit it. Deliberately excludes
 * `refetchOnMount: 'always'` — forcing every query in the app to refetch on
 * mount would be a broad behavior change; category queries opt in per query via
 * {@link categoryIdentityQueryPolicy}.
 */
export function applyCategoryIdentityQueryPolicy(
  { queryClient }: { queryClient: CategoryIdentityQueryClient },
) {
  const defaults = queryClient.getDefaultOptions()

  queryClient.setDefaultOptions({
    ...defaults,
    queries: {
      ...(defaults.queries ?? {}),
      retry: shouldRetry,
      refetchOnWindowFocus: shouldRefetch,
      refetchOnReconnect: shouldRefetch,
    },
  })

  return { pluginReturn: null }
}
