# Seller Browser Tests

The Playwright suite starts only the two seller frontends and uses a separately provisioned real test API. The web checkout does not launch the API checkout or read a shared readiness file.

## Local API checkout

Run the API checkout's `e2e:seller` command with the seller checkout path and Playwright command:

`pnpm e2e:seller -- --cwd /absolute/path/to/web/apps/seller -- pnpm exec playwright test`

The launcher creates an isolated migrated database, seeds the seller/shop, categories, attributes, shipping profile, and draft fixture, then supplies the API origin and fixture JSON to the command. It owns API shutdown and test-data cleanup on success, command failure, and interruption. The checkouts need not be adjacent.

## Independently provisioned API

Set these variables:

- `SELLER_E2E_API_ORIGIN`: required bare HTTP(S) origin, without credentials, path, query, or fragment. Browser requests use the seller proxy; direct readback uses the origin's `/v1` API.
- `SELLER_E2E_FIXTURES_JSON`: required provisioner-created JSON containing `seller.email`, `seller.password`, `shopPublicId`, `rootCategoryPublicId`, `childCategoryPublicId`, `fixtureProductPublicId`, and `fixtureProductTitle`. Identifiers must be nonempty strings belonging to that API's seeded data. Treat the JSON as credentials; do not print it in CI logs.

Run `pnpm --dir apps/seller exec playwright test` from the web checkout. The external provisioner owns cleanup in its `finally` or CI teardown. Never use production or an arbitrary developer database.

The suite checks API readiness and contract compatibility before browser tests. The mismatch runtime simulates prepared internal-ID generation `1`; the compatible runtime uses `SELLER_E2E_COMPATIBLE_GENERATION`, defaulting to the shared category contract (`2`). This is an explicitly selected test bundle, not automatic adoption of the backend contract version.

Run browser tests separately from Nuxt typechecks, unit-test environments, or static generation that write the same app's generated `.nuxt` state.
