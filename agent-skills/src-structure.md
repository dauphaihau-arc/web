# Web Source Structure

Use this file when adding files, moving code, or deciding where web behavior
belongs.

## Top-Level Ownership

- `apps/seller/` owns the seller-facing Nuxt app.
- `apps/storefront/` owns the buyer-facing storefront Nuxt app.
- `packages/` owns reusable workspace packages shared across web apps.

## App Source Ownership

Within each Nuxt app:

- `src/app/` owns Nuxt app surface: pages, layouts, middleware, plugins, app-shell components, assets, and locales.
- `src/domains/` owns business-facing client modules such as API clients, queries, mutations, stores, domain utilities, and domain-owned UI.
- `src/shared/` owns app-local primitives that are generic within that app.
- `src/server/` owns Nuxt server routes and server-only adapters.
- `src/public/` owns static public assets.

## Placement Rules

- Put route-level UI in `src/app/pages`.
- Put page-local components beside the page in a `_components` folder when they are only used by that route and are not part of a reusable domain workflow.
- Put domain-specific reusable components in `src/domains/<domain>/ui/`.
- Put business API calls, query keys, mutations, stores, and domain utilities in `src/domains/<domain>/`.
- Put generic app-local UI primitives, composables, config, navigation, and utilities in `src/shared/`.
- Put generic app-local UI components such as date pickers, table wrappers, and domain-neutral inputs in `src/shared/ui/`.
- Put cross-app reusable code in `packages/` when both seller and storefront need the same stable behavior.

## Avoid

- Do not put domain-specific business behavior in `src/shared/`.
- Do not put domain-specific UI in `src/shared/ui/`; keep it in the owning domain.
- Do not put reusable domain workflow components in `src/app/components/`.
- Do not copy contract logic between seller and storefront when a shared package already owns it.
- Do not put server-only behavior in client composables or stores.
- Do not add broad `utils` code unless the ownership is genuinely generic.
