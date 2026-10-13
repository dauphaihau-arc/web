# Arc Web

Nuxt monorepo for ARC web applications and shared frontend packages.

## Applications

| App | Purpose |
|----------|----------|
| Storefront | Customer marketplace |
| Seller | Seller management dashboard |
| Admin | Planned internal operations app |

## Repository Structure

```text
apps/
  storefront
  seller
  admin
packages/
  ui/
  composables/
docs/
```

## Documentation

- [Architecture overview](docs/architecture/overview.md)
- [Application structure](docs/architecture/application-structure.md)
- [Monorepo architecture](docs/architecture/monorepo.md)
- [Platform](docs/platform.md)
- [Deployment](docs/deployment.md)
- [Frontend type boundaries](docs/fe-type-boundaries.md)
- [Nuxt auto imports](docs/nuxt-auto-imports.md)
- [Architecture decisions](docs/adrs/)
- [Troubleshooting](docs/troubleshooting/)

## Requirements

- Node.js `22.13.0`
- PNPM `8.13.1`

## Common commands

Run these from `apps/web`.

- Start storefront: `pnpm dev:storefront`
- Start seller: `pnpm dev:seller`
- Build an app: `pnpm build:<app>`
- Generate static output: `pnpm generate:<app>`
- Preview a built app: `pnpm preview:<app>`
- Typecheck an app: `pnpm typecheck:<app>`
- Test an app: `pnpm test:<app>`
- Lint an app: `pnpm lint:<app>`
- Auto-fix lint issues: `pnpm lint:fix:<app>`

Available app names:

- `storefront`
- `seller`

Shared package commands:

```bash
pnpm lint:packages
pnpm lint:packages:fix
```

## Seller browser tests

Playwright starts the two seller frontends only. It consumes a separately
provisioned real test API; the web checkout does not launch an API checkout or
read a shared readiness file.

For local runs, the API checkout provides `e2e:seller`. Run it from that API
package with an explicit seller checkout path and command:

`pnpm e2e:seller -- --cwd /absolute/path/to/web/apps/seller -- pnpm exec playwright test`

The launcher creates an isolated migrated database, seeds the seller/shop,
categories, attributes, shipping profile, and draft fixture, then supplies the
API origin and fixture JSON to the command. It owns API shutdown and test-data
cleanup on success, command failure, and interruption. Neither checkout needs
to be adjacent to the other.

For an API provisioned independently by CI or another launcher, supply:

- `SELLER_E2E_API_ORIGIN`: required bare HTTP(S) origin, without credentials,
  path, query, or fragment. Browser requests use the seller proxy; direct
  readback uses the origin's `/v1` API.
- `SELLER_E2E_FIXTURES_JSON`: required provisioner-created JSON containing
  `seller.email`, `seller.password`, `shopPublicId`, `rootCategoryPublicId`,
  `childCategoryPublicId`, `fixtureProductPublicId`, and `fixtureProductTitle`.
  Identifiers must be nonempty strings belonging to that API's seeded data.
  Treat the JSON as credentials; do not print it in CI logs.

Then run `pnpm --dir apps/seller exec playwright test` from the web checkout.
The external provisioner remains responsible for cleanup in its own `finally`
or CI teardown step. Do not point the suite at production or an arbitrary
developer database.

The suite checks API readiness and contract compatibility before browser tests.
The mismatch runtime simulates the prepared internal-ID generation `1`;
the compatible runtime uses `SELLER_E2E_COMPATIBLE_GENERATION`, defaulting to
the shared category contract (`2`). This is an explicitly selected test bundle,
not automatic adoption of the backend contract version.

Run browser tests separately from Nuxt typechecks, unit-test environments, or
static generation that write the same app's generated `.nuxt` state.

## Authentication

Seller and storefront do not store token expiry timestamps in localStorage.
The shared API client sends credentials with requests and, when enabled,
attempts session refresh after a recoverable `401` before retrying the original
request once. Only the API codes `ACCESS_TOKEN_EXPIRED` and
`ACCESS_TOKEN_MISSING` are recoverable; every other `401` (bad credentials,
invalid signature, revoked session) and any `403` is returned to the caller
without a refresh attempt.

## CI/CD

### CI

GitHub Actions runs app-aware validation:

- `storefront` changes run storefront lint, typecheck, test, and build
- `seller` changes run seller lint, typecheck, test, and build
- shared `packages/*` changes trigger both app pipelines

### Deployment

The web apps deploy to Netlify as two separate sites from the same repository.

- storefront site builds `apps/storefront`
- seller site builds `apps/seller`
- each site uses an app-local `netlify.toml` with ignore rules so unrelated pushes can be skipped

See [Deployment](docs/deployment.md) for the current deployment setup.
