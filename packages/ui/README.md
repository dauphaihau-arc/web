# `@arc/ui`

Shared UI for `apps/storefront`, `apps/seller`, and `apps/admin`.

## Purpose

This package is the shared presentation layer for:

- design tokens
- Nuxt UI theme defaults
- reusable UI primitives and patterns
- cross-app feature states
- shared feature shells that are structurally identical across apps

It is not the place for app-specific business logic, route decisions, or data-fetching rules.

## Source Of Truth

Use these files as the primary UI configuration sources:

- tokens: `src/foundation/design-tokens.ts`
- shared CSS token utilities: `src/foundation/design-tokens.css`
- Nuxt UI defaults: `src/foundation/app-config.ts`
- icon aliases and bundles: `src/foundation/app-icon.constants.ts`

If a color, radius, shadow, layout width, or shared utility is repeated in app code, move it here first instead of copying it again.

## Component Tiers

Keep components in `src/` in one of these tiers. The folder is the tier:
`primitives/`, `patterns/`, `features/`, `shells/`.

### 1. Primitives — `src/primitives/`

Single visual unit: one element or one control, no anatomy (no header/body/actions
structure), no data or view-model contract.

Examples:

- `app-icon.vue`
- `loading-svg.vue`
- `radio-input.vue`
- `radio-group-input.vue`
- `status-badge.vue`
- `shortcut-hint.vue`

Rules:

- prefer generic names
- prefer presentational props over domain-specific props
- avoid route logic, query logic, and mutation logic
- no data model, no required item shapes; if a component needs a view model, it is a pattern

Note: `shortcut-hint.vue` reads `useShortcuts()` from Nuxt UI's auto-imports, so it
only resolves inside a consuming Nuxt app. Replacing it with a local implementation
would change the displayed meta key, so leave it as is until Nuxt UI exposes the
composable through an importable entry point.

### 2. Patterns — `src/patterns/`

Compositions with a fixed anatomy (header/body/actions), a view-model contract, or
shared interaction behavior. Still domain-neutral.

Examples:

- `empty.vue` (icon or avatar, title, description, actions, variants, sizes)
- `section-header.vue` (title, description, badge, actions slot)
- `app-panel.vue` (surface container preset)
- `app-state-block.vue` (panel + tone/align preset)
- `timeline.vue` (item model with `state` and `icon`)
- `data-table/data-table.vue` (Nuxt UI `UTable` wrapper with row-click, hover actions, per-column slots)
- `dialog/base-dialog.vue`, `dialog/dialog-actions.vue`
- `data-filter/`
- `fixed-pagination.vue`

Rules:

- the anatomy is fixed; variation goes through slots, not new required props
- keep app-specific data adapters outside the package

### 3. Features — `src/features/`

Cross-app product states whose copy is product-specific but still identical in every
consumer. A component lands here when it is not generic UI yet is also not a shell.

Examples:

- `category-identity-update-card.vue` (app/server category schema mismatch notice)

Rules:

- the component owns product copy and the state it represents
- if copy or behavior starts diverging per app, move it into the owning app's
  `src/domains/` or `src/shared/` instead of adding props

### 4. Feature Shells — `src/shells/`

Shared structural components for workflows that exist in every app with near-identical UI framing, plus app chrome.

Examples:

- `app-splash.vue`
- `backend-wake-up-overlay.vue`
- `notification-popover/`
- `conversation/`
- `chat-thread-panel.vue`
- `auth/reset-password-shell.vue`

Rules:

- structure can be shared
- app-specific navigation and data adapters stay in app code
- if header/body/composer/details differ materially, use slots instead of encoding app behavior

## What Should Stay App-Local

Do not move code into `@arc/ui` when the duplication is only superficial.

Keep code local when it contains:

- app-specific route mapping
- API contract differences
- permissions or auth behavior
- product-specific copy that is likely to diverge
- substantially different interaction semantics behind a similar layout

Good example:

- notification popover wrapper logic stays app-local because storefront and seller navigate to different targets even though the popover shell is shared

## Naming Conventions

Prefer consistent prop names across shared components:

- `headingClass` for heading element overrides
- `containerClass` for outer shell/layout overrides
- `actionsClass` for action-row overrides
- `emptyText` for list/panel empty states
- `emptyStateText` for “no item selected” shell states
- `loadingText` for loading copy

Avoid introducing new one-off names like `panelClass`, `contentClass`, or `titleClass` unless there is a strong reason.

## Slots vs Props

Prefer props when:

- the value is simple text or a small style override
- the component can stay declarative

Prefer slots when:

- apps need different subtrees
- one side needs actions and the other does not
- the shared component should own layout, but not the exact content

## Extraction Rule

Move something into `@arc/ui` only when all of these are true:

1. it appears in both apps or is clearly intended to
2. the structure is materially the same
3. the shared API can stay small and understandable
4. the result reduces duplication without hiding important app differences

If those conditions are not met, keep it local.

## Current Shared Surface

At the time of writing, the shared layer covers:

- design tokens and layout utilities
- Nuxt UI theme defaults
- icon aliases (`primitives/app-icon.vue`)
- form controls (`primitives/radio-input.vue`, `primitives/radio-group-input.vue`)
- status and shortcut display (`primitives/status-badge.vue`, `primitives/shortcut-hint.vue`)
- loading indicator (`primitives/loading-svg.vue`)
- empty states and headers (`patterns/empty.vue`, `patterns/section-header.vue`)
- surfaces and state blocks (`patterns/app-panel.vue`, `patterns/app-state-block.vue`)
- data table wrapper (`patterns/data-table/data-table.vue`)
- timelines (`patterns/timeline.vue`)
- dialogs (`patterns/dialog/`)
- filters and pagination (`patterns/data-filter/`, `patterns/fixed-pagination.vue`)
- app shell chrome (`shells/`)
- category schema mismatch notice (`features/category-identity-update-card.vue`)

## When Adding A New Shared Component

Use this checklist:

1. add or reuse tokens first
2. pick the tier: primitive, pattern, feature, or shell
3. keep app-specific routing/data logic outside the package
4. expose the smallest prop API that still works
5. prefer slots over over-configurable prop matrices
6. update consumers in every app that shares it
7. run typecheck for all three apps

## Verification

After changes in this package, validate all three apps:

```bash
pnpm typecheck:seller
pnpm typecheck:admin
pnpm typecheck:storefront
pnpm check:architecture
git diff --check
```
