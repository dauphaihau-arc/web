# Data Fetching

Vue Query (`@arc/nuxt-vue-query`) is the server-state layer; `useAsyncData` /
`useFetch` are not used for API data. The performance lever is therefore not
`pick`/`getCachedData` but *when* a query runs and *how long* the server waits.

## Storefront Home: First Rail

`apps/storefront/src/app/pages/index/index.vue` prefetches trending products on the
server:

```ts
if (import.meta.server) {
  await Promise.race([
    prefetchTrendingProducts(useQueryClient(), trendingLimit),
    new Promise<void>(resolve => setTimeout(resolve, 2500)),
  ]).catch(() => {})
}
```

What it buys:

- The first product card's image is in the initial HTML with `eager` +
  `fetchpriority="high"`, so it is discovered with the document instead of after
  hydration plus an API round trip. See [images.md](./images.md).
- The dehydrated query cache serves the client render, so the rail does not
  refetch on mount: the section passes `staleTime: 60_000`,
  `refetchOnMount: false`, `refetchOnWindowFocus: false`.
- The 2500 ms budget is the contract. On timeout the client query issues the
  request as before. Never raise the budget to make a slow API fit — fix the API or
  accept the client fetch.

The home route is ISR-cached per URL (3600 s), so currency- and session-dependent
data cannot be baked into the cache. That is why the first rail is rendered with
data and the rest fetches on the client.

## Header Categories

`apps/storefront/src/app/plugins/root-categories.ts` resolves the header's root
categories during SSR so the markup carries the real list instead of placeholders
the client hydrates into a different list. It is the reference implementation for
bounded SSR fetching; copy its shape rather than inventing another.

| Concern | Rule |
|---|---|
| Render wait | `RENDER_WAIT_BUDGET_MS = 1500`; on timeout the fetch is aborted and the header renders placeholders |
| Cache | process-local `Map`, 60 s TTL, keyed by the full market header set |
| Retries | one attempt, `retryOnWakeUp: false` — the wake-up recovery spends the budget in retry delays |
| Context | the whole prefetch runs inside `nuxtApp.runWithContext`; a continuation outside the render's async context throws `NUXT_E1001` |
| Observability | `log.info/warn/error` on cache hit, fetch, timeout, failure |

Two rules fall out of this and apply to any new SSR prefetch:

- **Abort, do not orphan.** Work that outlives the request runs without a Nuxt
  context. If the budget expires, cancel the fetch.
- **Do not bootstrap state from a prefetch.** Market bootstrap belongs to
  `apps/storefront/src/app/plugins/current-user.ts`. Driving it from a header
  prefetch puts the request on the API client's wake-up recovery path. Without a
  resolved market the prefetch skips and the client fetches after hydration.

## Related

- [README.md](./README.md)
- [rendering-strategies.md](./rendering-strategies.md) — which routes render on the server
- [images.md](./images.md) — the image this prefetch exists for
