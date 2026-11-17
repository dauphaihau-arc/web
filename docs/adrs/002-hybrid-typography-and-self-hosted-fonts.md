# ADR-002: Hybrid Typography With Self-Hosted Brand Faces

## Status

Accepted

## Date

2026-11-17

## Context

Seller, Admin, and Storefront share one design system, and all three previously
rendered entirely with the Tailwind system stack. The product needs a recognizable
brand and clearer heading hierarchy without turning body copy into a font-loading
problem.

Constraints that shaped the decision:

- body copy is read for long stretches; it should stay on the system stack for
  readability, accessibility text scaling, and zero bytes;
- the primary market is Vietnamese, so heading glyphs must cover Vietnamese
  diacritics;
- the apps are separate Nuxt builds but must stay visually identical;
- no runtime request may go to a third-party font provider;
- the local font provider in `@nuxt/fonts` emits no `unicode-range`.

## Options Considered

### Option A: System Stack Everywhere

- Pros: zero font payload, no swap, no licensing, no maintenance.
- Cons: no brand differentiation; headings and wordmark stay interchangeable with
  any other product.

### Option B: One Custom Family Everywhere

- Pros: strongest visual identity and one family to maintain.
- Cons: body copy pays the bandwidth, and a display-oriented face can hurt
  long-form readability.

### Option C: Hybrid System Body + Brand Heading And Wordmark

- Pros: identity where it pays off (headings, wordmark), system readability for
  body, small payload, no third-party requests.
- Cons: two families and two files to maintain; headings and wordmarks must stay
  scoped so chrome does not drift.

### Option D: Fetch From A Font CDN

- Pros: one link, no vendored binaries.
- Cons: third-party requests, privacy and availability coupling, and the local
  provider's git-tracked output cannot be reviewed.

## Decision

Adopt Option C.

- Body copy, navigation, forms, and tables keep the Tailwind system `sans` stack.
- Headings use Plus Jakarta Sans (`wght 200 800`), applied only inside
  `.layout-content` through `.layout-content :is(h1…h6)`.
- The `Arc`/`ARC` wordmark uses Sora (`wght 100 800`) through `font-brand`.
- Families live in `designFonts` in
  `packages/ui/src/foundation/design-tokens.ts`; `sharedTailwindTheme` exposes
  `font-heading` and `font-brand`.
- WOFF2 files live in `packages/ui/src/foundation/fonts/` and are resolved by the
  `@nuxt/fonts` local provider. All three apps import the same
  `sharedFonts` config from `packages/ui/src/foundation/nuxt-fonts.ts`.
- The app builds emit hashed copies under `_nuxt/fonts/` and serve them from their
  own origin.
- Plus Jakarta Sans ships as one file subsetted to the union of the Latin and
  Vietnamese ranges. Two faces with the same descriptors would collide because
  the local provider does not emit `unicode-range`.

## Consequences

- Headings and the wordmark get brand identity; body copy downloads no font and
  keeps system text scaling.
- The full font payload is about 84 KB raw (Sora 33,652 B, Plus Jakarta Sans
  50,728 B). The JS/CSS budgets do not count font bytes; the current pair is the
  documented budget, and any new family or subset increase must be stated in the
  PR.
- Only two files and two families are maintained. Adding a third face requires a
  budget and documentation update.
- `font-display: swap` still happens, but Nuxt Fonts emits size-adjusted fallback
  faces, so heading shift is bounded.
- Replacing a font file requires a clean build: an incremental Nuxt build can
  copy the previous asset.
- Storefront visual-regression baselines change when a face changes, because
  same-origin `_nuxt/fonts` assets are part of the capture.
- Body pieces inside `.layout-content` are unaffected; the rule targets heading
  elements only, and dialogs/teleported chrome outside the container keep the
  system font.

## Implementation Notes

- `packages/ui/src/foundation/nuxt-fonts.ts` — shared provider and family config.
- `packages/ui/src/foundation/fonts/` — WOFF2 files, OFL licences, provenance and
  regeneration steps.
- `packages/ui/src/foundation/design-tokens.ts` — `designFonts` and Tailwind
  `fontFamily`.
- `packages/ui/src/foundation/app-base.css` — `.layout-content` heading scope.
- Each app's `nuxt.config.ts` adds `@nuxt/fonts` and `fonts: sharedFonts`; layout
  shells add `layout-content`; wordmark nodes add `font-brand`.

Verification used for this decision: clean production builds of all three apps,
source/output WOFF2 hash comparison, no `fonts.googleapis.com` or
`fonts.gstatic.com` references in the output, `document.fonts` loading from the
app origin, computed styles (Sora wordmark, Plus Jakarta Sans heading, system body
and out-of-scope heading), and Vietnamese glyph coverage checked with fontTools.

## References

- `docs/performance/fonts-css.md`
- `docs/architecture/design-system/design-system.md`
- `docs/architecture/design-system/design-tokens.md`
- `packages/ui/src/foundation/fonts/README.md`
