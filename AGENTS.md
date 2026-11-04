# Arc Web Agent Instructions

This directory contains the Nuxt web monorepo.

## Before Editing

1. Determine whether the work belongs to seller, admin, storefront, or a shared workspace package.
2. Read `agent-skills/README.md`, then load only the focused guidance needed for the change.
3. For UI work, inspect the nearest existing page, component, and app pattern before adding new structure.
4. For cross-app behavior, check the shared packages before duplicating logic between seller and storefront.

## Guidance Router

The canonical web guidance index is `agent-skills/README.md`.

Load only the files relevant to the task:

- File placement or app/domain/shared ownership: `agent-skills/src-structure.md`
- Cross-domain and shared package boundaries: `agent-skills/domain-boundaries.md`
- UI conventions: `agent-skills/ui-conventions.md`
- Behavior changes and bug fixes: `agent-skills/testing.md`

## App Ownership

- Seller app: `apps/seller/`
- Admin app: `apps/admin/`
- Storefront app: `apps/storefront/`
- Shared workspace packages: `packages/`

Prefer shared packages for stable cross-app contracts and primitives. Keep
app-specific workflows in the owning app.

## API Types

API request and response types come from the generated module under
`packages/schemas/src/api/generated/`. Never edit generated files.

```bash
pnpm generate:api-types
pnpm generate:api-types -- --check
```

- Regenerate after `apps/api/api/openapi.json` changes; do not hand-fix types.
- `@arc/enums` is hand-written and checked for conformance against the spec,
  not generated.
- From the repository root, `./scripts/verify api-types` runs the check.

## Verification

For all web checks:

```bash
pnpm check
```

For focused checks:

```bash
pnpm check:seller
pnpm check:admin
pnpm check:storefront
```

From the repository root:

```bash
./scripts/verify web
./scripts/verify seller
./scripts/verify admin
./scripts/verify storefront
```
