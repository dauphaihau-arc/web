# Application Structure

Arc Web applications use a feature-based structure inside each Nuxt app. Product-specific workflows live under app-owned domain folders, while generic app infrastructure and reusable helpers live in dedicated app-level directories. Domain-owned UI stays with the domain; generic app-local UI stays under `shared/ui`.

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
- app-shell components
- locale files
- assets

`domains/` contains product features organized by business area. Examples include `auth`, `cart`, `checkout`, `market`, `product`, and `shop`.

Domain folders may include a `ui/` directory for reusable components that belong to that product domain. For example, checkout-specific components belong in `src/domains/checkout/ui/`.

`shared/` contains app-local reusable code that is useful across domains but not stable or generic enough to move into `packages/*`. Generic app-local UI primitives belong in `src/shared/ui/`, such as date pickers, table wrappers, and domain-neutral inputs.

`server/` contains Nuxt server routes and server-only app code.

`public/` contains static assets served directly by the app.

## Domain Boundaries

Domain code should represent product language and workflows. A domain can contain its own `ui/`, components, composables, schemas, helpers, and state when those pieces belong to that business area.

Pages should stay thin. They should compose domain UI components, call composables, and handle route-level concerns instead of owning business logic directly.

## Shared Code Rules

Use app-local `shared/*` when code is reused inside one app and is generic across domains. Use `shared/ui/` for domain-neutral UI primitives.

Use workspace `packages/*` when code is reusable across apps and has a stable contract.

Keep domain-specific UI out of `shared/ui/`. If a component imports domain stores, queries, mutations, contracts, or uses product vocabulary such as checkout, cart, order, shop, or product, it belongs under the owning `domains/<domain>/ui/`.

Avoid importing domain feature code across apps. Cross-app reuse should happen through shared packages or through duplicated product-specific implementations when the workflows are intentionally different.

## Related Docs

- `docs/architecture/monorepo.md`
- `docs/architecture/design-system.md`
- `docs/fe-type-boundaries.md`
- `docs/nuxt-auto-imports.md`
