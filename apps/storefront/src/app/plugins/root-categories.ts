import type { Category } from '@arc/models/category';
import type { QueryClient } from '@tanstack/vue-query';
import { log } from '@arc/lib';
import { fetchRootCategories, rootCategoriesQueryOptions } from '~/domains/category/queries/categories.query';
import { getRequestMarketHeaders } from '~/domains/market/stores/request-market-context';

const LOG_TAG = '[root-categories][SSR]';

/** How long a fetched list is reused across SSR requests in this process. */
const CACHE_TTL_MS = 60_000;

/**
 * How long a render waits for a miss before giving up and leaving the header on
 * its placeholder row. The fetch is aborted at that point: work that outlives the
 * request runs without a Nuxt context, and the API client's wake-up recovery
 * touches Nuxt state from its retry timers (`NUXT_E1001`).
 */
const RENDER_WAIT_BUDGET_MS = 1_500;

interface CacheEntry {
  data: Category[]
  fetchedAt: number
}

/** Returned by the race when the render budget runs out before the fetch settles. */
const WAIT_BUDGET_EXCEEDED = Symbol('wait-budget-exceeded');

const cache = new Map<string, CacheEntry>();

function isFresh(entry: CacheEntry) {
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

function delay(ms: number) {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  setTimeout(resolve, ms);
  return promise;
}

async function loadCategories(
  queryClient: QueryClient,
  {
    cacheKey,
    market,
    waitBudgetMs,
  }: {
    cacheKey: string
    market: string
    waitBudgetMs: number
  },
): Promise<void> {
  const cached = cache.get(cacheKey);

  if (cached && isFresh(cached)) {
    log.debug(`${LOG_TAG} cache hit`, {
      market,
      count: cached.data.length,
      ageMs: Date.now() - cached.fetchedAt,
    });
    queryClient.setQueryData(rootCategoriesQueryOptions.queryKey, cached.data);
    return;
  }

  const controller = new AbortController();
  const startedAt = Date.now();

  // SSR gets one attempt: the wake-up recovery would spend the render budget in
  // retry delays, and its timers outlive the request that owns the Nuxt context.
  const pending = queryClient
    .fetchQuery({
      ...rootCategoriesQueryOptions,
      retry: false,
      queryFn: () => fetchRootCategories({
        signal: controller.signal,
        retryOnWakeUp: false,
      }),
    })
    .then((data) => {
      if (!data?.length) {
        log.warn(`${LOG_TAG} fetched an empty list`, { market });
        return data;
      }

      cache.set(cacheKey, { data, fetchedAt: Date.now() });
      log.info(`${LOG_TAG} fetched`, {
        market,
        count: data.length,
        durationMs: Date.now() - startedAt,
      });

      return data;
    })
    .catch((error: unknown) => {
      // An abort is our own budget expiring, already logged where it was decided.
      if (!controller.signal.aborted) {
        log.error(`${LOG_TAG} fetch failed`, { market, error });
      }

      return undefined;
    });

  const data = await Promise.race([
    pending,
    delay(waitBudgetMs).then(() => WAIT_BUDGET_EXCEEDED),
  ]);

  if (data === WAIT_BUDGET_EXCEEDED) {
    log.warn(`${LOG_TAG} wait budget exceeded, aborting fetch and rendering placeholders`, {
      market,
      waitedMs: Date.now() - startedAt,
    });
    controller.abort();
    return;
  }

  if (Array.isArray(data) && data.length) {
    queryClient.setQueryData(rootCategoriesQueryOptions.queryKey, data);
  }
}

/**
 * Resolve the header's root categories during SSR so the markup carries them
 * instead of placeholders the client hydrates into a different list. The list is
 * market-scoped (it is sent with the market headers), so it is cached per market.
 */
export async function prefetchRootCategories(
  queryClient: QueryClient,
  {
    waitBudgetMs = RENDER_WAIT_BUDGET_MS,
  }: { waitBudgetMs?: number } = {},
): Promise<void> {
  const marketStore = useMarketStore();

  log.info(`${LOG_TAG} prefetch start`);

  // No market bootstrap here: `plugins/current-user.ts` owns it, and driving it
  // from a header prefetch would put this request on the API client's wake-up
  // recovery path (multi-second retry delays whose timers outlive the render).
  // Without a resolved market there are no market headers to key the list by, so
  // the header keeps its placeholders and the client fetches after hydration.
  if (!marketStore.isMarketReady) {
    log.info(`${LOG_TAG} market not ready, skipping prefetch`);
    return;
  }

  const headers = getRequestMarketHeaders();
  const market = `${headers['X-Market-Code']}/${headers['X-Locale']}`;

  await loadCategories(queryClient, {
    cacheKey: JSON.stringify(headers),
    market,
    waitBudgetMs,
  }).catch((error: unknown) => {
    log.error(`${LOG_TAG} prefetch failed`, { market, error });
  });
}

export default defineNuxtPlugin(async (nuxtApp) => {
  if (import.meta.client) {
    return;
  }

  // Pin the Nuxt instance for the whole prefetch: the API client reads
  // `useRuntimeConfig` per attempt, and a continuation that resumes outside the
  // render's async context throws NUXT_E1001 instead of the real network error.
  await nuxtApp.runWithContext(() => prefetchRootCategories(useQueryClient()));
});
