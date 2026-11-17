# Web Performance

How `apps/web` keeps Storefront, Seller, and Admin fast: what is tuned, the time
budgets attached to server work, and the rules a change has to satisfy.

This folder is the performance record, one file per topic. It is not a catalogue
of everything Nuxt can do — it describes what this codebase does and why.
Route-level rendering policy lives in
`docs/performance/rendering-strategies.md`; CI commands and thresholds live in
`docs/test-strategy/test-strategy.md`.

The stack is Nuxt 4.6.4 with Vue Query 5 for server state.

## Goals

- Put above-the-fold content and its images in the first HTML response.
- Bound server render time: no API call may hold a page open past its budget.
- Defer below-the-fold work — chunk and hydration — until it is visible.
- Keep the PR gate deterministic; keep noisy lab numbers out of PRs.
- Change performance by removing a measured cause, not by adding a library.

## Current State

Only two surfaces have been tuned end to end: the storefront home route and the
storefront header. Everything else is guarded by budgets, not optimized.

| Surface | Rendering | Tuning |
|---|---|---|
| Storefront home `/` | ISR 3600 s | First rail server-prefetched, seven sections lazy-hydrated |
| Storefront header | every route | Root categories server-prefetched, megamenus intent-loaded |
| Storefront `/c/**`, `/search` | uncached SSR | none; correct caching is the requirement, not speed |
| Storefront cart/checkout/account/orders | CSR | shells only; no server render to tune |
| Seller | CSR default + SSR allowlist | deep links resolve in one round trip |
| Admin | CSR default + SSR allowlist | same |

## Budgets

Bundle size is the blocking PR gate. `performance-budgets.json` is the source of
truth; `scripts/check-bundle-budget.mjs` reads the built client assets and fails
when a limit is exceeded. Each app CI job runs it right after its build.

| App | Client JS (gzip) | Client CSS (gzip) | Largest chunk (raw) |
|---|---|---|---|
| storefront | 512 KB | 26 KB | 154 KB |
| seller | 768 KB | 29 KB | 392 KB |
| admin | 344 KB | 21 KB | 113 KB |

Totals catch distributed growth; the largest-chunk limit catches one heavy
dependency without penalizing route splitting. Raise a limit in the same PR as
the feature that needs it, with the reason in the PR body; ratchet it down in the
PR that lands the win.

## Topics

| Topic | File | Status |
|---|---|---|
| Measure first | [measurement.md](./measurement.md) | PR budget, nightly Lighthouse, deploy probes, no RUM |
| Reduce JavaScript | [javascript.md](./javascript.md) | route splitting, lazy hydration, bundled icons |
| Images and media | [images.md](./images.md) | stored variants, `provider: 'none'`, one priority image |
| CSS and fonts | [fonts-css.md](./fonts-css.md) | system body, self-hosted heading/brand faces, CSS budget, opacity-only transitions |
| Rendering strategy | [rendering-strategies.md](./rendering-strategies.md) | CSR default + SSR allowlist, ISR |
| Runtime and framework | [runtime.md](./runtime.md) | intent-loaded megamenus, paginated lists |
| Layout stability | [layout-stability.md](./layout-stability.md) | CLS gate, reserved geometry |
| Data fetching | [data-fetching.md](./data-fetching.md) | SSR fetch budgets, dehydrated cache |
| Ongoing process | [process.md](./process.md) | review rules, budget ratchet |

Network and delivery is not a topic here: compression, CDN caching, and immutable
hashed assets are Netlify's defaults, and the repository owns none of it. The parts
that do matter in the repo are covered by
[rendering-strategies.md](./rendering-strategies.md) (which routes may cache) and
[measurement.md](./measurement.md) (how caching is verified).

## Non-Goals

- Raising Lighthouse scores on product, category, or search pages; only server
  rendering + correct caching is asserted there.
- Lighthouse coverage for Seller and Admin: authenticated, no public URL.
- Image transformation or an image CDN; callers select a pre-generated variant
  from the asset host.
- RUM/web-vitals instrumentation (no collector).
- Islands/partial hydration beyond the built-in lazy hydration; the header, rails,
  and listing pages need interactivity on mount.

## Related Docs

- `docs/performance/rendering-strategies.md`
- `docs/platform.md`
- `docs/test-strategy/test-strategy.md`
- `docs/deployment.md`
- `apps/storefront/README.md` (ISR verification)
