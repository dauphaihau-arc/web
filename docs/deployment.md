# Web Deployment

The web repo deploys to Netlify with two separate sites connected to the same Git repository.

## Deployment model

- storefront site
- seller site

Each site should:

- keep the repository root as the base directory
- set its package directory to the app folder
- use the app-local `netlify.toml`
- publish the app-qualified Netlify output path, for example `apps/storefront/dist`

Both sites use Nitro's Netlify server target:

- **Storefront** builds with `nuxt build` and runs on the Nitro server runtime. `/c/**` must resolve categories at request time with SSR enabled and ISR/cache disabled to return authoritative HTTP `301`, `404`, and backend errors; static generation cannot satisfy that contract. Other routes retain their configured ISR/client-rendering rules.
- **Seller** builds with `nuxt build` and runs on the Nitro server runtime. The seller site needs a runtime for its `/api/**` proxy rule (`nuxt.config.ts`), which forwards browser and SSR requests to `API_BASE_URL`. Static generation cannot serve that proxy, so the seller site must not revert to `nuxt generate`.

Seller routes are server-rendered per route, listed in `routeRules` (`apps/seller/nuxt.config.ts`): the auth pages plus the seller surfaces (`/dashboard`, `/orders`, `/orders/*`, `/products`, `/products/*`, `/coupons`, `/notifications`, `/settings/shipping`). Editor and realtime flows (`/products/new`, `/products/import`, `/messages`) stay client-rendered, and `'/**': { ssr: false }` keeps everything else as-is.

Because `accessToken` lives for 15 minutes while `refreshToken` lives for days, a server-rendered page would otherwise read an expired access token as a signed-out seller. `apps/seller/src/server/middleware/session-refresh.ts` rotates the session before the render: it refreshes when the access cookie is expired and a refresh cookie is present, relays the rotated cookies to the browser, and rewrites the request cookies so this render uses the fresh token.

In the browser, the shared API client deduplicates overlapping refresh attempts for recoverable 401s (`ACCESS_TOKEN_EXPIRED` or `ACCESS_TOKEN_MISSING`). Requests on the same client await one refresh, then each retries once. The promise is cleared after success or failure. This coordination is browser-only: server requests do not share refresh state between users, and seller's SSR middleware is unchanged. Separate tabs and 401s arriving after refresh completes are not coordinated.

Because the seller app serves the API through its own origin, the API session cookies must be readable by the seller origin:

- `AUTH_COOKIE_DOMAIN` must be set to the shared parent domain (for example `.arc.com`) in production so the browser sends `accessToken`/`refreshToken` to the seller origin.
- Websocket (`/ws`) and server-sent event (`/v1/me/events`) clients bypass the proxy and connect to `API_ORIGIN` directly; they rely on the same shared cookie domain and on `api.arc.com` being a same-site subdomain.
- Leave `AUTH_COOKIE_DOMAIN` unset for local development; cookies ignore ports, so `localhost:4000` and `localhost:4002` already share them.

Sources:

- [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/)
- [Netlify ignore builds](https://docs.netlify.com/build/configure-builds/ignore-builds/)

## Recommended Netlify settings

### Storefront site

- Base directory: repository root
- Package directory: `apps/storefront`
- Config file: `apps/storefront/netlify.toml`

### Seller site

- Base directory: repository root
- Package directory: `apps/seller`
- Config file: `apps/seller/netlify.toml`

Both app-local `netlify.toml` files set `NODE_OPTIONS=--max-old-space-size=4096`. The Nitro `netlify` preset bundles the SSR server (server rollup plus node-file-trace) and needs more heap than Netlify's default Node old-space ceiling (~2 GB). Keep this allowance for both server builds.

## Ignore rules

Each site now has an app-local `ignore` command in `netlify.toml`.

- [apps/storefront/netlify.toml](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/apps/storefront/netlify.toml:1)
- [apps/seller/netlify.toml](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/apps/seller/netlify.toml:1)

Netlify's current docs say:

- by default, changes in the repository root can trigger builds for all connected sites in a monorepo
- an `ignore` command can narrow that behavior
- an exit code of `0` skips the build
- an exit code of `1` continues the build

Current behavior after these changes:

- storefront builds only when `apps/storefront`, shared `packages`, or root workspace files change
- seller builds only when `apps/seller`, shared `packages`, or root workspace files change

## Important note

Netlify's docs also say that `ignore` does not cancel builds triggered by build hooks.

So this setup assumes:

- Netlify auto-deploy from Git stays enabled
- GitHub Actions does not trigger Netlify build hooks for these sites

## Category identity cutover

Deploy seller and storefront as generation `2` bundles only after category
identity preparation and catalog reprojection have passed the API release gate.
The staged procedure and SQL preflight live in
[category public identity cutover runbook](../../api/docs/operations/deployment/category-public-identity-cutover.md)
in the enclosing Arc checkout; this web checkout can be deployed independently,
but the category semantic switch must be coordinated with that API release.

- Set `API_BASE_URL` and `API_VERSION=1` at build time. For a server runtime
  override, set `NUXT_PUBLIC_API_BASE_URL`; this is the actual override for
  `runtimeConfig.public.apiBaseURL`, not `API_BASE_URL` alone.
- Do not pin `NUXT_PUBLIC_CATEGORY_IDENTITY_CONTRACT_VERSION=1` on the public-ID
  build. That value belongs only to a preparation bundle that still uses
  internal UUID semantics.
- Keep `/c/**` out of static fallback rewrites and prerendered output. Deploy
  the generated Nitro functions as well as the app's public assets. Verify a
  legacy path or wrong slug with redirect auto-follow disabled: one HTTP `301`
  to the flat canonical URL, followed by `200` at its destination.
- Seed the hierarchy before traffic; moves, new availability controls, and
  explicit admin slug edits are deferred. Unsupported hierarchy changes can
  leave cached facet scope stale for up to five minutes.
- Root `scripts/verify` covers checks/unit suites, not browser journeys.
  Run the category SSR, real-API redirect, persisted-state, and seller suites
  separately using the app READMEs before activation.
