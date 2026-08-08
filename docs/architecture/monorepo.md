# Monorepo Architecture

Arc Web uses a monorepo so multiple web applications can share tooling, package versions, CI rules, and reusable frontend packages while keeping product-specific code inside each app.

## Goals

- Keep Storefront, Seller, and future Admin development in one workspace.
- Share low-level frontend code without sharing product workflows.
- Run consistent lint, typecheck, test, and build commands across apps.
- Let CI validate only the apps and packages affected by a change.
- Deploy apps independently from the same repository.

## Workspace Layout

```text
apps/
  storefront/
  seller/
  admin/

packages/
  ui/
  composables/
  contracts/
  schemas/
  models/
  enums/
  utils/
  lib/
```

## Ownership Model

Applications own routes, layouts, plugins, middleware, and product workflows. Shared packages own reusable primitives, contracts, schemas, and utilities that are not tied to one app.

Code should move into `packages/*` only when at least two apps need the same behavior or when the package represents a stable platform boundary.

## Dependency Direction

Apps may depend on shared packages. Shared packages should not depend on apps.

```text
apps/* -> packages/*
packages/* -> packages/*
packages/* -/> apps/*
apps/storefront -/> apps/seller
apps/seller -/> apps/storefront
```

Cross-app feature imports are avoided. If both apps need the same behavior, extract the reusable part into a shared package or an app-local `shared/*` module first.

## Related Docs

- `docs/adrs/001-adopt-monorepo-structure-for-web-apps.md`
- `docs/architecture/application-structure.md`
- `docs/deployment.md`
