# Admin App

Internal Arc admin portal built with Nuxt 3.

## Scope

The portal opens on `/shops`. It covers the shop directory and shop detail
(shop information, Seller Payable, Payout Account, payout history, commission
schedule), order listing and order detail (status, refund and support-note
updates), user administration, and the operator audit trail. There is no global
finance index, no dashboard/KPI surface, and no payout actions.

## Running it

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open the portal at <http://localhost:4003> (or `http://127.0.0.1:4003`; either works).

Browsers scope cookies by host and ignore the port, so every dev server reached
through the same host shares a single cookie jar — the seller portal on
`localhost:4002` included. The admin session stays isolated inside that shared
jar: this app reads and writes `adminAccessToken` and `adminRefreshToken`, and
calls the API with `x-auth-portal: admin`, while the seller portal and storefront
keep the legacy `accessToken` / `refreshToken` pair. Admin cookies remain
host-only: `AUTH_COOKIE_DOMAIN` is never set here.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server on port 4003 |
| `pnpm build` | Build the production bundle |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | Run Nuxt type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with autofix |
| `pnpm test` | Run the unit and Nuxt test suites |
| `pnpm test:unit` | Run unit tests only |
| `pnpm test:nuxt` | Run Nuxt environment tests only |
| `pnpm check` | Lint, typecheck and test in one pass |

The app proxies `/api/**` to the API origin so browser and SSR requests share
the web origin. `API_BASE_URL` (or `API_ORIGIN`) points at the API; the seller
and storefront links come from `SELLER_APP_URL` and `STOREFRONT_APP_URL`.

## Deployment

Two targets ship the same Nuxt build:

- **Docker** — `apps/admin/Dockerfile` builds a `node:20-alpine` image from the
  workspace root. The production image listens on `HOST=0.0.0.0` and `PORT=4003`
  and runs `node .output/server/index.mjs`. Build it from `apps/web`:

  ```bash
  docker build -f apps/admin/Dockerfile -t arc-admin .
  docker run -p 4003:4003 --env-file apps/admin/.env arc-admin
  ```

- **Netlify** — `apps/web/apps/admin/netlify.toml` runs
  `pnpm --filter @arc/admin build` and publishes `apps/admin/dist`. Its
  `ignore` rule rebuilds only when `apps/admin`, `packages`, `package.json`,
  `pnpm-lock.yaml` or `pnpm-workspace.yaml` change. The Nitro `netlify` preset
  peaks above Netlify's default heap ceiling, so the build environment sets
  `NODE_OPTIONS=--max-old-space-size=4096`.

Both targets read configuration from the environment (`nuxt.config.ts`):

| Variable | Purpose |
| --- | --- |
| `API_BASE_URL` | API origin the `/api/**` proxy forwards to |
| `API_ORIGIN` | Absolute API origin for transports that bypass the proxy; falls back to `API_BASE_URL` |
| `API_VERSION` | API version prefix (`1`) |
| `SELLER_APP_URL` | Link target for the seller portal |
| `STOREFRONT_APP_URL` | Link target for the storefront |
| `ASSET_HOST` | Host serving static assets; empty for same-origin |

The admin session cookie stays host-only in every environment, so
`AUTH_COOKIE_DOMAIN` is never set for this app. Isolation from the seller portal
does not depend on the host name: the admin session lives in `adminAccessToken` /
`adminRefreshToken` and is addressed with `x-auth-portal: admin`, so the seller
and storefront cookies on the same host are left untouched.
