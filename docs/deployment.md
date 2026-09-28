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

The two sites use different Netlify targets:

- **Storefront** (`ssr: true` with prerendered routes) builds with `nuxt generate` and is served as static assets.
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
