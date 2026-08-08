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

- Node.js `20.20.2`
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
