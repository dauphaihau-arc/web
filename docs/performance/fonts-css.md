# CSS And Fonts

## Fonts

There are no web fonts. The apps use the Tailwind system stack, so there is no
font loading, no `font-display` tuning, no subsetting, and no font-driven layout
shift. `@nuxt/fonts` is deliberately absent; adding a custom family means adding
a font budget and a `size-adjust` fallback in the same change.

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
- [layout-stability.md](./layout-stability.md) — no font swap means no font shift
- `packages/ui/src/foundation/app-base.css`
