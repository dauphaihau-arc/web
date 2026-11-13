# Arc Web

Nuxt monorepo for ARC web applications and shared frontend packages.

## Applications

| App | Purpose |
|----------|----------|
| Storefront | Customer marketplace |
| Seller | Seller management portal |
| Admin | Internal operations portal |

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
- [Monorepo architecture](docs/architecture/monorepo.md)
- [Application structure](docs/architecture/application-structure.md)
- [Design system](docs/architecture/design-system/design-system.md)
- [Platform](docs/platform.md)
- [Deployment and CI/CD](docs/deployment.md)
- [Seller browser tests](docs/seller-e2e.md)
- [Frontend type boundaries](docs/fe-type-boundaries.md)
- [Nuxt auto imports](docs/nuxt-auto-imports.md)
- [Architecture decisions](docs/adrs/)
- [Troubleshooting](docs/troubleshooting/)

## Requirements

- Node.js `24.19.0`
- PNPM `9.3.0`

## Common commands

Run these from `apps/web`.

- Start storefront: `pnpm dev:storefront`
- Start seller: `pnpm dev:seller`
- Start admin: `pnpm dev:admin`
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
- `admin`

Shared package commands:

```bash
pnpm lint:packages
pnpm lint:packages:fix
```
