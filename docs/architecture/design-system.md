# Design System

Arc Web uses shared UI primitives and app-local components to keep interface behavior consistent while allowing each product surface to own its workflows.

## Goals

- Keep visual decisions consistent across applications.
- Provide reusable UI components and patterns.
- Avoid duplicating low-level UI primitives inside each app.
- Let product-specific screens compose shared primitives without forcing identical page layouts.
- Keep component behavior and styling patterns predictable across apps.

## Layers

The UI architecture has three layers:

```text
packages/ui/
  shared primitives and reusable UI building blocks

apps/<app>/src/shared/ui/
  app-local reusable UI

apps/<app>/src/domains/*/
  product-specific feature UI
```

## Shared Components

Shared components should be generic, composable, and independent from product workflows. They should not know about Storefront, Seller, Admin, shops, carts, orders, or other domain-specific concepts.

Domain-specific components should stay inside the application domain that owns the workflow.

## When to Promote UI

Start UI inside the app or domain that needs it. Promote it to app-level `shared/ui` when multiple domains in one app need it. Promote it to `packages/ui` when multiple apps need the same primitive or pattern.

Avoid promoting UI only because it might be reused later. Shared UI creates an API surface, so it should be extracted when the contract is clear.

## Related Docs

- `docs/architecture/design-tokens.md`
- `docs/architecture/application-structure.md`
- `docs/architecture/monorepo.md`
