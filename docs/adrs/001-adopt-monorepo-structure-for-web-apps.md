# ADR-001: Adopt Monorepo Structure for Web Apps

## Status

Proposed

## Date

2026-05-24

## Context

The current web frontend is a single Nuxt application that contains buyer-facing storefront flows and seller-facing management flows in the same app. Seller functionality currently lives under `/account/shop/*`, while shared domain code already spans storefront, shop, and admin concerns under `src/shared/*`.

We expect the product to grow into three distinct surfaces:
- Storefront for buyers
- Seller for merchant operations
- Admin for internal operations

These surfaces have different optimization goals.

Buyer site is optimized for:
- SEO
- speed
- conversion
- marketing

Seller dashboard is optimized for:
- data-heavy UI
- tables
- charts
- operational workflows

This decision needs to support:
- independent deployment per subdomain
- clearer app boundaries by user type and permission model
- controlled sharing of low-level code without sharing page-level features
- phased migration from the current single-app structure without a disruptive rewrite

## Options Considered

### Option A: Keep a single Nuxt app and separate only by routes

- Pros: lowest short-term migration cost, one build pipeline, minimal tooling change
- Cons: storefront, seller, and admin remain tightly coupled; deploys stay all-or-nothing; route-level separation does not create real app boundaries

### Option B: Split into multiple repositories

- Pros: strongest isolation between apps, fully independent release cycles
- Cons: duplicates tooling and shared code management; harder to keep contracts, schemas, and UI primitives aligned; higher operational overhead for a small team

### Option C: Adopt a monorepo with multiple apps and shared packages

- Pros: independent apps with shared packages, better subdomain deployment model, controlled reuse, easier incremental extraction from the current codebase
- Cons: adds workspace tooling and package-boundary discipline; poor package design could recreate coupling in a different form

## Decision

We will adopt a monorepo structure for the web frontend with separate applications for storefront, seller, and admin, plus shared packages for reusable low-level code.

Target structure:

```text
apps/
  storefront
  seller
  admin
packages/
  api
  schemas
  ui
  config
  utils
```

We will not split the current app into multiple applications immediately. The first migration step is to extract existing reusable code from `src/shared/*` into workspace packages. After shared package boundaries are stable, we will move storefront and seller into separate apps. Admin will be introduced as a separate app when its scope is concrete enough to justify a dedicated surface.

## Consequences

- We gain the ability to deploy storefront, seller, and admin independently to different subdomains.
- We reduce long-term coupling between buyer, seller, and internal workflows.
- We must define strict package boundaries so `packages/*` does not become a new monolith.
- We accept additional workspace, CI, and local development complexity.
- Migration will be phased, so the current single-app structure will coexist with extracted packages for some period.

## Migration Notes

1. Introduce workspace tooling and root-level app/package layout.
2. Extract shared code from `src/shared/*` into reusable packages.
3. Move buyer-facing code into `apps/storefront`.
4. Move seller functionality from `/account/shop/*` into `apps/seller`.
5. Add `apps/admin` when internal operations requirements are defined.

## Notes

- Shared packages should contain primitives such as API clients, schemas, enums, utilities, and UI foundations.
- Feature pages, feature-specific forms, and app-specific navigation should remain inside each app unless there is a strong reason to share them.
