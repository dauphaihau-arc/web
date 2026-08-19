# Arc Web Agent Instructions

This directory contains the Nuxt web monorepo.

## Before Editing

1. Determine whether the work belongs to seller, storefront, or a shared workspace package.
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
- Storefront app: `apps/storefront/`
- Shared workspace packages: `packages/`

Prefer shared packages for stable cross-app contracts and primitives. Keep
app-specific workflows in the owning app.

## Verification

For all web checks:

```bash
pnpm check
```

For focused checks:

```bash
pnpm check:seller
pnpm check:storefront
```

From the repository root:

```bash
./scripts/verify web
./scripts/verify seller
./scripts/verify storefront
```
