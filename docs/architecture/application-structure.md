# Application Structure

Arc Web applications use a feature-based structure inside each Nuxt app. Product-specific workflows live under app-owned domain folders, while generic app infrastructure and reusable helpers live in dedicated app-level directories.

## App Layout

Each application follows this shape:

```text
apps/<app>/src/
  app/
  domains/
  shared/
  server/
  public/
```

## Directory Responsibilities

`app/` contains Nuxt-facing application code:

- pages
- layouts
- middleware
- plugins
- app-local components
- locale files
- assets

`domains/` contains product features organized by business area. Examples include `auth`, `cart`, `checkout`, `market`, `product`, and `shop`.

`shared/` contains app-local reusable code that is useful across domains but not stable or generic enough to move into `packages/*`.

`server/` contains Nuxt server routes and server-only app code.

`public/` contains static assets served directly by the app.

## Domain Boundaries

Domain code should represent product language and workflows. A domain can contain its own components, composables, schemas, helpers, and state when those pieces belong to that business area.

Pages should stay thin. They should compose domain components, call composables, and handle route-level concerns instead of owning business logic directly.

## Shared Code Rules

Use app-local `shared/*` when code is reused inside one app.

Use workspace `packages/*` when code is reusable across apps and has a stable contract.

Avoid importing domain feature code across apps. Cross-app reuse should happen through shared packages or through duplicated product-specific implementations when the workflows are intentionally different.

## Related Docs

- `docs/architecture/monorepo.md`
- `docs/architecture/design-system.md`
- `docs/fe-type-boundaries.md`
- `docs/nuxt-auto-imports.md`
