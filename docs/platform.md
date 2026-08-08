# Platform

Arc Web uses Nuxt 3 as the frontend application platform for Storefront, Seller, and future Admin applications. The platform standardizes application setup, state management, data fetching, localization, UI foundations, assets, and bundle behavior across apps.

## Goals

- Keep Nuxt application setup consistent across apps.
- Provide shared state and server-state patterns.
- Support localized product experiences.
- Keep UI foundations reusable without coupling product workflows.
- Configure assets, images, and bundle splitting consistently.
- Keep app-specific platform behavior explicit in each app.

## Nuxt Application Model

Each app uses Nuxt 3 with a consistent application surface:

```text
src/app/
  pages/
  layouts/
  middleware/
  plugins/
  components/
  locales/
  assets/
```

Nuxt owns routing, layouts, plugin registration, middleware loading, and auto-import behavior. Product-specific workflows should stay in domain folders and be composed from pages.

## State Management

Arc Web uses Pinia for client-side application state.

Use Pinia for state that belongs to the interactive app experience, such as session-aware UI state, cart state, filters, or workflow state.

Avoid using Pinia as a replacement for server-state caching.

## Server-State Fetching

Arc Web uses Vue Query for server-state fetching and caching.

Use Vue Query for API-backed data that needs request lifecycle handling, caching, loading states, invalidation, or refetching.

Keep server-state access inside composables or domain modules so pages stay thin.

## Internationalization

Apps support localization through Nuxt i18n with lazy-loaded locale files.

Locale files should stay app-owned unless translations or locale utilities become reusable across multiple apps.

## UI Foundation

The frontend platform uses shared UI primitives, app-local components, and Nuxt UI as the component foundation.

Reusable product-agnostic UI belongs in shared UI packages. Product-specific UI should stay inside the app or domain that owns the workflow.

## Assets and Images

Asset and image behavior is configured through Nuxt and runtime configuration.

Apps should avoid hardcoded asset hosts. Public asset URLs, image hosts, and app-to-app links should come from environment-specific runtime config.

## Bundle Strategy

Nuxt provides route-based code splitting by default. Apps can add lazy loading for interaction-heavy surfaces or large feature areas.

Shared dependencies may be split into stable bundles when it improves caching and reduces repeated download cost.

## Related Docs

- `docs/architecture/application-structure.md`
- `docs/architecture/design-system.md`
- `docs/architecture/rendering-strategies.md`
- `docs/operations/runtime-config.md`
```
