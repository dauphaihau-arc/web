# `@arc/ui`

Shared UI for `apps/storefront` and `apps/seller`.

## Purpose

This package is the shared presentation layer for:

- design tokens
- Nuxt UI theme defaults
- reusable UI primitives
- shared feature shells that are structurally identical across apps

It is not the place for app-specific business logic, route decisions, or data-fetching rules.

## Source Of Truth

Use these files as the primary UI configuration sources:

- tokens: [src/design-tokens.ts](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/packages/ui/src/design-tokens.ts:1)
- shared CSS token utilities: [src/design-tokens.css](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/packages/ui/src/design-tokens.css:1)
- Nuxt UI defaults: [src/app-config.ts](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/packages/ui/src/app-config.ts:1)

If a color, radius, shadow, layout width, or shared utility is repeated in app code, move it here first instead of copying it again.

## Component Tiers

Keep components in `src/` in one of these tiers.

### 1. Primitives

Low-level building blocks with minimal domain knowledge.

Examples:

- `app-panel.vue`
- `app-state-block.vue`
- `section-header.vue`
- `dialog-actions.vue`
- `fixed-form-actions.vue`
- `base-dialog.vue`

Rules:

- prefer generic names
- prefer presentational props over domain-specific props
- avoid route logic, query logic, and mutation logic

### 2. Feature Shells

Shared structural components for workflows that exist in both apps with near-identical UI framing.

Examples:

- `notification-popover.vue`
- `notification-popover-panel.vue`
- `conversation-inbox-shell.vue`
- `conversation-list-panel.vue`
- `conversation-thread-panel.vue`

Rules:

- structure can be shared
- app-specific navigation and data adapters stay in app code
- if header/body/composer/details differ materially, use slots instead of encoding app behavior

### 3. Utilities And Assets

Examples:

- `app-icon.vue`
- `loading-svg.vue`

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
- panel/state/header/dialog primitives
- fixed form action bars
- notification popover shell
- conversation inbox shell
- conversation thread shell

## When Adding A New Shared Component

Use this checklist:

1. add or reuse tokens first
2. decide whether it is a primitive or a feature shell
3. keep app-specific routing/data logic outside the package
4. expose the smallest prop API that still works
5. prefer slots over over-configurable prop matrices
6. update consumers in both apps if the component is meant to be shared immediately
7. run typecheck for both apps

## Verification

After changes in this package, validate both apps:

```bash
./node_modules/.bin/tsc --noEmit -p apps/storefront/tsconfig.json
./node_modules/.bin/tsc --noEmit -p apps/seller/tsconfig.json
git diff --check
```
