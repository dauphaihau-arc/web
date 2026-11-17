# CSS And Fonts

## Fonts

The apps use a hybrid type system: system fonts for body copy, one self-hosted
face for headings, and one for the wordmark.

| Role | Family | Utility | File |
|---|---|---|---|
| Body, nav, forms, tables | Tailwind system stack | `font-sans` (default) | none |
| Headings inside page content | Plus Jakarta Sans, `wght 200 800` | `font-heading` | `plus-jakarta-sans-200-800-latin.woff2` (50,728 B) |
| Arc wordmark | Sora, `wght 100 800` | `font-brand` | `sora-100-800-latin.woff2` (33,652 B) |

Families are declared once in `designFonts`
(`packages/ui/src/foundation/design-tokens.ts`), which feeds
`sharedTailwindTheme`. The heading face is applied by
`.layout-content :is(h1…h6)` in `app-base.css`, so header, sidebar, footer,
dialog, and third-party markup keep the system font. Wordmarks opt in with
`font-brand`.

Files live in `packages/ui/src/foundation/fonts/` and are wired through
`packages/ui/src/foundation/nuxt-fonts.ts` (`sharedFonts`). Every app adds the
`@nuxt/fonts` module and spreads that config. The module resolves both families
with its `local` provider from `local.dirs`, so:

- nothing is fetched from Google, Bunny, or Fontsource, at build or runtime;
- each app emits hashed copies under `_nuxt/fonts/` and serves them from its own
  origin with the normal immutable asset cache;
- `@font-face` rules are injected into the HTML with `font-display: swap` and
  size-adjusted fallback faces (`size-adjust`, ascent/descent overrides), so a
  swap does not move the heading box more than the matched metrics allow.

Body copy downloads no font. The whole font payload is the two files above
(~84 KB raw), which the `clientCssGzipBytes` / `clientJsGzipBytes` budgets do
not count. Treat the current pair as the font budget: a new family or a subset
increase must be stated in the PR and recorded here. No app may add a
`fonts.googleapis.com` link or a provider `@import`.

The Plus Jakarta Sans file is subset once to the union of the Latin and
Vietnamese ranges. The local provider emits no `unicode-range`; shipping the two
subsets as separate faces would let the later face win for every character.
Regeneration, provenance, licensing, and the clean-build requirement after
replacing a file are in
[`packages/ui/src/foundation/fonts/README.md`](../../packages/ui/src/foundation/fonts/README.md).

## CSS

Each app has one `css` entry (`~/app/assets/css/main.css`) that pulls the shared
foundation chain, inlined by `postcss-import` before Tailwind runs. Tailwind
purges by default, so unused utility classes do not ship. The CSS budget in
`performance-budgets.json` (see [README.md](./README.md) §Budgets) is the guard
against a page-scoped stylesheet growing the global bundle.

## Page Transitions

Transitions are opacity-only (`packages/ui/src/foundation/app-base.css`):

```css
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
}
```

`filter` plus `transition: all` — the previous implementation — did two harmful
things while it applied: it became the containing block for `position: fixed`
dialogs and drawers, and it re-rasterized the whole page. Any property that
establishes a containing block (`filter`, `transform`, `will-change`,
`backdrop-filter`) in a page-level transition reintroduces both problems.

The whole-page fade is disabled under `prefers-reduced-motion: reduce`, because a
full-page fade is a vestibular trigger.

## Related

- [README.md](./README.md)
- [layout-stability.md](./layout-stability.md) — metric-matched swap bounds heading shift
- [Design system — Typography](../architecture/design-system/design-system.md#typography)
- [ADR-002: Hybrid typography](../adrs/002-hybrid-typography-and-self-hosted-fonts.md)
- [Font assets and regeneration](../../packages/ui/src/foundation/fonts/README.md)
- `packages/ui/src/foundation/app-base.css`
