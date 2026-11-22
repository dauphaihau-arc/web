# Platform

Arc Web uses Nuxt 4 as the frontend application platform for Storefront, Seller, and future Admin applications. The platform standardizes application setup, state management, data fetching, UI foundations, assets, and bundle behavior across apps.

## Goals

- Keep Nuxt application setup consistent across apps.
- Provide shared state and server-state patterns.
- Keep UI foundations reusable without coupling product workflows.
- Configure assets and images consistently.
- Keep app-specific platform behavior explicit in each app.

## Nuxt Application Model

Each app uses Nuxt 4 with a consistent application surface:

```text
src/app/
  pages/
  layouts/
  middleware/
  plugins/
  components/
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

## Language

The Storefront ships with English (`en`) and Vietnamese (`vi`) UI translation. English is the
default and has no URL prefix; Vietnamese renders under `/vi/**`. The URL language prefix is the
rendering source of truth, so shared ISR output stays correct per path.

Storefront UI copy lives in `apps/storefront/src/i18n/locales/{en,vi}` and is rendered through
Nuxt i18n. English is the source key set; a missing Vietnamese key falls back to English, and CI
checks key parity. Seller and Admin are not localized by this contract.

Language-bearing request headers come from the URL locale, not from the persisted preference, and
are typed by `StorefrontLanguages` in `packages/enums/src/market.ts`. The Buyer Language Preference
still drives the language switcher and server-produced buyer messages; the i18n runtime does not
add a second locale cookie.

## UI Foundation

The frontend platform uses shared UI primitives, app-local components, and Nuxt UI as the component foundation.

Reusable product-agnostic UI belongs in shared UI packages. Product-specific UI should stay inside the app or domain that owns the workflow.

## Assets and Images

Asset and image behavior is configured through Nuxt and runtime configuration.

Apps should avoid hardcoded asset hosts. Public asset URLs, image hosts, and app-to-app links should come from environment-specific runtime config.

## Bundle Strategy

Nuxt provides route-based code splitting by default. Apps can add lazy loading for interaction-heavy surfaces or large feature areas.

Shared dependencies may be split into stable bundles when it improves caching and reduces repeated download cost.

Bundle budgets, SSR fetch budgets, and the per-route performance techniques are documented in `docs/performance/README.md`.

## Related Docs

- `docs/performance/README.md`
- `docs/architecture/application-structure.md`
- `docs/architecture/design-system/design-system.md`
- `docs/performance/rendering-strategies.md`
- `docs/operations/runtime-config.md`
```
