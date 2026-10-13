# Storefront E2E

This folder contains Playwright browser tests for the storefront app.

## Current scope

- Real browser coverage through Playwright
- Network-level API stubs for deterministic first-pass tests
- Focus on critical user flows before expanding to seeded full-stack scenarios

## Run

```bash
pnpm e2e
pnpm e2e:smoke
pnpm e2e:headed
pnpm e2e:ui
```

## SSR mode

The default suite serves pre-rendered static output (`pnpm generate` + `serve`),
which cannot prove server-side rendering or HTTP status behavior. The
SSR-capable mode builds and launches the real Node server entrypoint
(`.output/server/index.mjs`) against a deterministic backend fixture:

```bash
# Builds .output, starts the real server + fixture, runs the SSR specs
pnpm e2e:ssr

# Build only (reuse across runs)
pnpm e2e:ssr:build
E2E_MODE=ssr playwright test --config ./playwright.config.ts e2e/category/category-direct-access.spec.ts
```

- `E2E_MODE=ssr` switches `playwright.config.ts` to the SSR web servers.
- The fixture backend lives in `support/ssr-fixture-server.mjs` and is driven by
  the fixture graph in `support/ssr-fixtures.mjs`; it serves `/health/ready` and
  `/v1/**` to both the SSR renderer and the browser, and records every request
  (`/__fixture/requests`) so specs can assert what a page actually issued.
- Requests outside the fixture contract are answered with 500 and recorded as
  `unexpected`, so a spec fails when the app calls something the fixture does
  not model.
- The fixture port defaults to 4310 (`E2E_FIXTURE_PORT`) and matches the base URL
  baked by `pnpm e2e:ssr:build`; change both together.
- SSR specs run single-worker because the fixture keeps one shared request log.
- The fixture category hierarchy is fixed and seeded: specs never mutate it at
  runtime, and resolution ancestry is served from the seeded tree. Category
  listing and facet scope therefore resolve against the same seeded subtree, and
  the API's five-minute taxonomy-subtree cache is consistent with it; the suite
  makes no immediate post-mutation consistency claim.
- Category canonicalization fixtures (`LEGACY_CATEGORY_ID_BY_PATH`,
  `CANONICAL_PATH_BY_ID`) model permanently owned legacy paths, a Unicode slug,
  and two categories that share one slug. Every redirect is asserted with
  `maxRedirects: 0` so the spec proves the actual `301` and `Location`, then
  fetches the destination again to prove it serves `200` with no second redirect.

## Real-API mode

The category canonicalization journey also has a real-backend mode that runs the
built storefront against a **real API over HTTP on a fresh, migrated PostgreSQL
database** — no backend fixture. The API harness
(`apps/api/api/test/support/category-redirect-e2e-api.ts`) inserts categories
before the identity migration runs, so slugs and permanently owned legacy-path
aliases come from persisted rows, then boots the real `AppModule` and prints a
ready line carrying the origin and fixture paths.

```bash
# 1. Build the storefront SSR output
pnpm e2e:ssr:build

# 2. Start the real API harness (apps/api/api) and read its CATEGORY_E2E_READY line
node -r ts-node/register/transpile-only -r tsconfig-paths/register \
  test/support/category-redirect-e2e-api.ts

# 3. Run the journey with the reported origin + fixtures (storefront dir)
CATEGORY_E2E_API_ORIGIN=<origin> CATEGORY_E2E_FIXTURES_JSON='<fixtures>' \
  npx playwright test --config ./playwright.category-redirect.config.ts
```

- `playwright.category-redirect.config.ts` refuses to run without
  `CATEGORY_E2E_API_ORIGIN`, and points the server at the harness through
  `NUXT_PUBLIC_API_BASE_URL` (a public `runtimeConfig` value is only overridable
  at runtime through its `NUXT_PUBLIC_*` env var).
- The harness allows exactly the storefront origin through CORS, mirroring the
  deployment's `CORS_ALLOWED_ORIGINS`; without it the browser cannot reach the
  real API.
- The harness drops its own database on shutdown, so no fixture outlives a run.

## Current specs

- `auth/protected-route.spec.ts`
- `auth/login.spec.ts`
- `category/category-identity.spec.ts` (static mode)
- `category/category-direct-access.spec.ts` (SSR mode)
- `category/category-canonical-redirects.spec.ts` (SSR mode)
- `e2e-real-api/category-real-api-redirect.spec.ts` (real API + PostgreSQL)
- `checkout/redirect.spec.ts`
- `guest-orders/lookup.spec.ts`
- `preferences/currency-product-price.spec.ts`

## Next flows worth promoting to stronger e2e coverage

- Guest add-to-cart and cart persistence
- Buy-it-now to checkout session
- Cart merge after login using seeded backend data
- Account messages send-message flow
- Browser notification enable/disable flow

## Structure

- `support/factories.ts`: small mock data builders
- `support/network.ts`: shared route interception helpers
- feature folders: spec files grouped by user flow
- `@smoke` title tag: small PR-ready checks selected by `pnpm e2e:smoke`
