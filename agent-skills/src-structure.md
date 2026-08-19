# Web Source Structure

Use this file when adding files, moving code, or deciding where web behavior
belongs.

## Top-Level Ownership

- `apps/seller/` owns the seller-facing Nuxt app.
- `apps/storefront/` owns the buyer-facing storefront Nuxt app.
- `packages/` owns reusable workspace packages shared across web apps.

## App Source Ownership

Within each Nuxt app:

- `src/app/` owns Nuxt app surface: pages, layouts, middleware, plugins, app-level components, assets, and locales.
- `src/domains/` owns business-facing client modules such as API clients, queries, mutations, stores, and domain utilities.
- `src/shared/` owns app-local primitives that are generic within that app.
- `src/server/` owns Nuxt server routes and server-only adapters.
- `src/public/` owns static public assets.

## Placement Rules

- Put route-level UI in `src/app/pages`.
- Put page-local components beside the page in a `_components` folder when they are not reused broadly.
- Put business API calls, query keys, mutations, and stores in `src/domains/<domain>/`.
- Put generic app-local composables, config, navigation, and utilities in `src/shared/`.
- Put cross-app reusable code in `packages/` when both seller and storefront need the same stable behavior.

## Avoid

- Do not put domain-specific business behavior in `src/shared/`.
- Do not copy contract logic between seller and storefront when a shared package already owns it.
- Do not put server-only behavior in client composables or stores.
- Do not add broad `utils` code unless the ownership is genuinely generic.
