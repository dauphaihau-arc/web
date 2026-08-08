# Design Tokens

Design tokens define shared visual values for Arc Web applications. They keep common styling decisions consistent across apps and reduce one-off values in product screens.

## Goals

- Keep color, spacing, typography, radius, shadow, and state styling consistent.
- Make visual changes predictable across Storefront, Seller, and future Admin surfaces.
- Give shared UI components stable styling inputs.
- Reduce duplicated hardcoded style values in app and domain code.

## Token Scope

Tokens should represent repeated visual decisions, not one-off screen styling. Common token categories include:

- color
- typography
- spacing
- radius
- shadow
- border
- interaction states

## Usage Rules

Use tokens when a style decision appears across multiple components, domains, or apps.

Keep domain-specific styling local when it belongs to one product workflow and does not represent a shared visual rule.

Treat token changes as platform changes because they can affect multiple applications at once.

## Relationship to the Design System

Design tokens provide the visual foundation for shared UI components. The design system consumes tokens, while product-specific feature UI composes design-system components and app-local UI.

## Related Docs

- `docs/architecture/design-system.md`
- `docs/architecture/application-structure.md`
