# Arc Web Monorepo

This repository is now structured as a monorepo.

## Layout

```text
apps/
  storefront
  seller
  admin
packages/
```

## Current status

- `apps/storefront` contains the existing Nuxt application.
- `apps/seller` is a placeholder for the next app.
- `apps/admin` is a placeholder for the next app.
- `packages/` is reserved for shared code extraction in the next phase.

## Common commands

Run these from the repository root:

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```
