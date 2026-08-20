# Testing Strategy

Use this file when changing behavior, fixing bugs, or deciding whether a web
change needs tests.

## Decision Rule

- Add or update tests when a change affects business behavior, routing, stores, query/mutation behavior, validation, permissions, or a reported bug.
- Do not add tests for purely mechanical changes such as formatting, comments, renames, or local refactors with no behavior change.
- Prefer the smallest test that proves the changed behavior.
- Favor cheap deterministic tests for business logic before adding heavier Nuxt or browser coverage.

## Test Layers

- Unit/domain tests: pure Vitest tests for utilities, schemas, mappers, validation, permissions, cart/checkout calculations, query key helpers, and other deterministic business logic.
- Nuxt integration tests: Vitest with `@nuxt/test-utils` for middleware, plugins, composables, stores, and components that need Nuxt runtime, auto-imports, routing, or app providers.
- Playwright E2E tests: real browser coverage for critical user journeys only. Ask whether a production break in the flow would be treated as an incident.

Default environments by layer:

- Unit/domain tests -> Vitest `node`.
- Component tests that do not need Nuxt app runtime -> Vitest `happy-dom` or `jsdom`.
- Nuxt integration tests -> Vitest `nuxt`.
- Browser journey tests -> Playwright.

Do not try to cover every component directly. Avoid tests that only prove mount existence, CSS classes, emitted clicks, or direct mutation of component internals. Prefer assertions against user-visible behavior, navigation, data changes, and business outcomes.

## Placement Rules

- App-level behavior: use the nearest existing test style in `apps/seller/test` or `apps/storefront/test`.
- Page or middleware behavior: test beside the existing app tests when available.
- Domain query/mutation/store behavior: test near the domain module or in the app test folder following local precedent.
- Shared package behavior: test in the owning package. Shared package logic is cross-app behavior and should not depend on an app test suite for coverage.

## Naming Rules

- Use `.test.ts` for cheap unit/domain tests that do not require Nuxt runtime.
- Use `.nuxt.test.ts` for tests that require Nuxt runtime, auto-imports, app plugins, routing, or mounted Nuxt components.
- Use `.spec.ts` for Playwright E2E tests.
- For storefront Playwright tests, add `@smoke` to PR-safe critical checks that should run in the smoke suite.

## E2E Scope

- Keep Playwright focused on flows such as login, signup, protected-route access, checkout/payment, search, account-critical CRUD, permissions, notifications, and other incident-level journeys.
- Prefer shared Playwright factories and network mocks over ad hoc per-test API stubbing.
- Do not use high retry counts to hide flaky tests. Retries should help diagnose flakes with traces, not make unstable tests look healthy.

## Verification Commands

From `apps/web`:

```bash
pnpm check
pnpm test
pnpm test:packages
pnpm check:seller
pnpm check:storefront
pnpm test:seller
pnpm test:storefront
pnpm --filter @arc/seller test:unit
pnpm --filter @arc/seller test:nuxt
pnpm --filter @arc/storefront test:unit
pnpm --filter @arc/storefront test:nuxt
pnpm --filter @arc/storefront e2e:smoke
```

From the repository root:

```bash
./scripts/verify web
./scripts/verify seller
./scripts/verify storefront
```
