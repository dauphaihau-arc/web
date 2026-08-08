# Architecture Overview

Arc Web is a Nuxt monorepo containing multiple web applications and shared frontend packages. The architecture separates product-specific application code from reusable platform code so each app can evolve independently while sharing common UI, contracts, schemas, composables, and utilities.

## Goals

- Keep applications independently owned and deployable.
- Share low-level frontend building blocks across apps.
- Avoid coupling product-specific features between apps.
- Keep page components thin by moving business logic into composables and stores.
- Support different rendering strategies based on each app's product needs.

## Workspace Model

The workspace is organized into application directories and shared packages:

```text
apps/
  storefront/
  seller/
  admin/

packages/
  ui/
  composables/
```

Applications own routes, layouts, middleware, plugins, and product workflows. Shared packages provide reusable primitives that do not depend on a specific application.

## Application Boundaries

Each app owns its product experience:

- `storefront` owns customer marketplace flows.
- `seller` owns seller dashboard workflows.
- `admin` is reserved for internal operations.

Apps should not import feature code from other apps. Shared behavior should move into `packages/*` only when it is genuinely reusable.

## Platform Decisions

Arc Web uses:

- Nuxt 3 for the application framework.
- Pinia for shared state patterns.
- Vue Query for server-state fetching.
- Nuxt i18n for localization.
- Shared UI packages and design tokens for consistent interface behavior.
- App-specific rendering rules for SSR, CSR, ISR, and static generation.

## Related Docs

- `docs/architecture/monorepo.md`
- `docs/architecture/application-structure.md`
- `docs/architecture/design-tokens.md`
- `docs/architecture/design-system.md`
- `docs/architecture/rendering-strategies.md`
- `docs/deployment.md`
