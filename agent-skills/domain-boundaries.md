# Web Domain Boundaries

Use this file when changing `src/domains`, shared packages, or code that spans
seller and storefront.

## Core Rule

App UI may compose domain modules, but domain modules should expose behavior
through their own API, query, mutation, and store files instead of leaking
implementation details across the app.

## Dependency Direction

- `src/app/pages` and app-level components may use `src/domains` and `src/shared`.
- `src/domains/<domain>` may use `src/shared` and stable workspace packages.
- `src/shared` must not depend on `src/domains`.
- Workspace packages should not depend on app-local source.
- Seller code must not import storefront source, and storefront code must not import seller source.

## Cross-App Behavior

When seller and storefront need the same stable contract or model:

1. check `packages/contracts`, `packages/models`, `packages/schemas`, `packages/enums`, and `packages/utils`
2. extend the owning package if the behavior is stable and cross-app
3. keep app-specific UI state and workflow details in the app

## Smell Tests

- A shared utility mentions a specific business workflow.
- A page imports another domain's low-level API file when a query or mutation wrapper exists.
- Seller and storefront implement the same request/response conversion separately.
- A workspace package imports from `apps/seller` or `apps/storefront`.
