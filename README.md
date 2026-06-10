# Arc Web Monorepo

Nuxt monorepo for ARC web applications and shared frontend packages.

## Layout

```text
apps/
  storefront
  seller
  admin
packages/
```

## Current status

- `apps/storefront` is the customer-facing web app.
- `apps/seller` is the seller-facing web app.
- `apps/admin` is reserved for a future app.
- `packages/` contains shared frontend code used by multiple apps.

## Requirements

- Node.js `20.20.2`
- PNPM `8.13.1`

## Common commands

Run these from the repository root.

### Storefront

```bash
pnpm dev:storefront
pnpm build:storefront
pnpm generate:storefront
pnpm preview:storefront
pnpm typecheck:storefront
pnpm test:storefront
pnpm lint:storefront
pnpm lint:fix:storefront
```

### Seller

```bash
pnpm dev:seller
pnpm build:seller
pnpm generate:seller
pnpm preview:seller
pnpm typecheck:seller
pnpm test:seller
pnpm lint:seller
pnpm lint:fix:seller
```

### Shared packages

```bash
pnpm lint:packages
pnpm lint:packages:fix
```

### Legacy root aliases

These remain available for convenience and currently point to `storefront`:

```bash
pnpm build
pnpm generate
pnpm preview
pnpm start
pnpm typecheck
pnpm test
pnpm lint
pnpm lint:fix
```

## Local quality gates

- `husky` installs Git hooks through `pnpm prepare`
- `pre-commit` runs `pnpm lint-staged`
- full validation runs in GitHub Actions CI rather than `pre-push`

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

See [docs/deployment.md](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/docs/deployment.md:1) for the current deployment setup.
