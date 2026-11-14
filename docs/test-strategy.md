# Test Strategy

How `apps/web` verifies behavior: which layer owns which test, how each layer
runs locally and in CI, and what is deliberately not covered.

## Layers

| Layer | Tool | Environment | Owns |
|---|---|---|---|
| Package/domain unit | Vitest | `node` | `packages/*` utilities, schemas, API client, enum conformance |
| App unit | Vitest | `node` | Pure functions, schemas, mappers, presentation helpers, query keys |
| App Nuxt integration | Vitest + `@nuxt/test-utils` | `nuxt` (happy-dom) | Middleware, plugins, composables, stores, mounted components using auto-imports, routing, providers |
| Storefront browser | Playwright | Static `generate` + `serve`, or SSR Node server | Critical journeys tagged `@smoke` plus category/checkout/guest-order flows |
| Seller browser | Playwright | Two dev bundles against an externally provisioned API | Category contract generation handshake |
| Real-API journey | Playwright | Built SSR server + real API + PostgreSQL | Category canonical redirects with persisted rows |

There are no snapshot-only, visual, or coverage-gated tests. Assertions target
user-visible behavior, navigation, network payloads, and business outcomes; tests
that only prove a component mounts or a class exists are out of scope.

## Suite layout

| Surface | Unit (`node`) | Nuxt integration | Browser |
|---|---|---|---|
| `packages/*` | 17 files / 92 tests | — | — |
| `apps/seller` | 23 / 213 | 44 / 280 | 3 / 4 |
| `apps/admin` | 3 / 57 | 4 / 20 | — |
| `apps/storefront` | 20 / 170 | 20 / 115 | 9 / 47 (`@smoke` + flows), 1 / 7 real-API |

All three apps use the same split:

- `vitest.unit.config.ts` collects `src/**/*.test.{ts,tsx}` and
  `test/**/*.test.{ts,tsx}` in `node`, excluding `*.nuxt.test.*`.
- `vitest.config.ts` collects only `src/**/*.nuxt.test.{ts,tsx}` and
  `test/**/*.nuxt.test.{ts,tsx}` under the Nuxt environment.
- Playwright specs are `*.spec.ts` under `e2e/`.

Consequence: a file that imports `mountSuspended`, `mockNuxtImport`, or relies on
Nuxt auto-imports **must** be named `*.nuxt.test.ts`; a plain `.test.ts` that
touches Nuxt runtime fails in the node environment (`defineNuxtRouteMiddleware is
not defined`) instead of silently passing in the wrong environment.

## Commands

From `apps/web`:

```bash
pnpm test                 # packages, then unit + nuxt for seller, admin, storefront
pnpm test:packages        # workspace package suites
pnpm test:seller          # unit + nuxt
pnpm test:admin
pnpm test:storefront
pnpm check                # architecture + shared-UI drift + lint + typecheck + all tests
```

Focused runs:

```bash
pnpm --filter @arc/seller test:unit
pnpm --filter @arc/seller test:nuxt
pnpm --filter @arc/storefront test:unit
pnpm --filter @arc/storefront test:nuxt
pnpm --filter @arc/storefront e2e:smoke
```

Browser suites:

| Command | What it does |
|---|---|
| `pnpm --filter @arc/storefront e2e` | Static `generate` + `serve`, all storefront specs |
| `pnpm --filter @arc/storefront e2e:smoke` | Same server, only specs titled `@smoke` |
| `pnpm --filter @arc/storefront e2e:ssr` | Builds `.output`, launches the Node server against the deterministic SSR fixture |
| `CATEGORY_E2E_API_ORIGIN=… npx playwright test --config ./playwright.category-redirect.config.ts` | Real API + PostgreSQL harness, run from `apps/storefront` |
| `pnpm --filter @arc/seller e2e` | Requires `SELLER_E2E_API_ORIGIN` and `SELLER_E2E_FIXTURES_JSON` from the API checkout's `e2e:seller` launcher |

## Coverage

Coverage is opt-in so normal runs stay fast; the shared settings live in
`vitest.coverage.ts` (apps) and `vitest.config.ts` (packages).

```bash
pnpm test:coverage                     # packages + all three apps
pnpm --filter @arc/seller test:coverage
pnpm test:packages:coverage
```

Reports are written to `coverage/packages` and `apps/*/coverage/{unit,nuxt}` as
`text`, `html`, and `lcov`. The unit and Nuxt runs of one app never overwrite
each other. There are no thresholds: coverage is a diagnostic, and the review
question stays "does the changed behavior have the smallest test that proves
it?" rather than "did the percentage move?".

## Performance gates

Two layers, deliberately different in strictness.

**Bundle budgets** are the blocking PR gate. `performance-budgets.json` holds,
per app, the total client JS gzip size, total client CSS gzip size, and the raw
size of the largest single JS chunk. `scripts/check-bundle-budget.mjs` reads the
built client assets (`.output/public/_nuxt`, or `dist/_nuxt` for the Netlify
preset) and fails when a limit is exceeded:

```bash
pnpm build:storefront
node scripts/check-bundle-budget.mjs storefront
node scripts/check-bundle-budget.mjs storefront seller admin
```

Totals catch distributed growth; the largest-chunk limit catches one heavy
dependency without penalizing legitimate route splitting. Limits start at the
current size plus headroom, so raise `performance-budgets.json` in the same PR as
the feature that needs it, with a reason, and ratchet the number down when a win
lands. Each app CI job runs the check right after its build.

**Lighthouse** is a nightly diagnostic, not a PR gate. Production pages sit
behind ISR and a real API; a PR-time score would compare cached and uncached
renders and jitter on shared runners. `.github/workflows/perf.yml` runs
`lhci autorun` nightly and on demand against the deployed storefront, with three
runs per URL and filesystem reports uploaded as the `lighthouse-reports`
artifact. Set the repository variable `LHCI_URLS` (comma-separated) to measure
more than the landing page; only server-rendered routes are meaningful, since
checkout, cart, account, orders, and guest orders are `ssr: false` shells.

`lighthouserc.cjs` gates on stable signals only: CLS and total page weight are
errors, LCP and TBT are warnings. Assertions aggregate runs by median (LHCI's
default is `optimistic`, which reports the best run for max* thresholds).

The storefront home route is the only page where the initial render was tuned:
`src/app/pages/index/index.vue` prefetches the first product rail on the server
(2.5 s budget) so the LCP image ships in the HTML with `priority`, and the
below-fold sections are `defineLazyHydrationComponent('visible', …)` so their
chunks and query setup wait for the scroll. Everything else on the page still
fetches client-side by design: the home route is ISR-cached per URL, so
currency-dependent data stays on the client.

Field data is the source of truth for whether the site is fast, but there is no
RUM collector in this stack yet: the API's observability is backend-only
(Prometheus scrape, Loki logs, OTEL traces, Sentry), so browser vitals have no
destination. Until one exists, treat LCP warnings as lab signal only and do not
add client instrumentation that cannot be recorded.

## CI gates

Workflow `.github/workflows/ci.yml`:

| Job | Trigger | Checks |
|---|---|---|
| `changes` | every PR/push | path filter producing `storefront`, `seller`, `admin` scopes |
| `packages` | every PR/push | `test:packages:coverage`, uploads `coverage-packages` |
| `storefront` | storefront or shared change | lint, typecheck, unit + nuxt, Netlify build, bundle budget, ISR artifact assert |
| `storefront-smoke` | storefront or shared change | `e2e:ssr:build`, then `E2E_MODE=ssr e2e:smoke` against the fixture backend, uploads `playwright-report-storefront-smoke` |
| `seller` | seller or shared change | lint, typecheck, unit + nuxt, build, bundle budget |
| `admin` | admin or shared change | lint, typecheck, unit + nuxt, build, bundle budget |
| `contract` | every PR/push | generated API types match the pinned contract |

`.github/workflows/perf.yml` is separate: nightly and manual Lighthouse runs
against production, never a PR gate.

Package changes mark all three app scopes dirty, so a shared-package change
cannot land while an app job fails. The package job runs unconditionally because
packages are consumed by everything and the suite takes seconds.

Not in CI, by design or by omission:

- Seller Playwright — needs an externally provisioned API and seeded fixtures.
- Storefront real-API category journey — needs a migrated PostgreSQL harness from
  the API checkout.
- Storefront static-mode suite — its `webServer` runs `nuxt generate`, which
  prerenders routes and needs a live API that CI does not provision. CI runs the
  `@smoke` subset in SSR mode against the deterministic fixture instead.
- Storefront full SSR suite — same fixture, but the whole flow set is local; CI
  runs only the `@smoke` subset.

## Adding tests

1. Choose the cheapest layer that can fail for the right reason: pure logic →
   `.test.ts`; Nuxt runtime or auto-imports → `.nuxt.test.ts`; incident-level
   journey → `.spec.ts` with `@smoke` when it must block PRs.
2. Put package logic in the owning package, not in an app suite.
3. Assert behavior and payloads over implementation details; do not re-pin
   wording, CSS classes, or incidental defaults.
4. For API contracts, extend the `SPEC_ONLY_ENUMS` allowlist in
   `packages/schemas/src/api/api-enums.conformance.test.ts` with a reviewable
   reason; never edit `packages/schemas/src/api/generated/`.
5. Run the narrowest command that exercises the change, then `pnpm check` before
   opening the PR when the change crosses app or package boundaries.

## Related Docs

- `docs/seller-e2e.md` — seller browser suite setup and fixtures.
