# Layout Stability

CLS is one of the two signals treated as an error, not a warning
(`lighthouserc.cjs`, ≤ 0.1). The rules that keep it there are structural: reserve
the geometry before the data arrives.

## Rules

- **Images always carry `width` and `height`** so the box exists before the file
  loads. See [images.md](./images.md).
- **Skeletons match the final box.** `ProductSection` renders a
  `USkeleton class="aspect-[1/1] w-full"` inside the same carousel geometry as the
  cards, so swapping skeleton for product does not move the page.
- **One row shape for SSR and hydration.**
  `apps/storefront/src/app/layouts/market/header/categories.vue` generates keyed
  placeholder items of fixed width (`w-20`, one line) and renders the same element
  for both states. Without the matching shape, Vue reuses the server nodes and
  keeps their skeleton classes, pinning every chip to the placeholder width and
  wrapping its label.
- **No content inserted above existing content** on load: header categories arrive
  either in the HTML or as the same-height placeholders (see
  [data-fetching.md](./data-fetching.md)).
- **No font swap shift.** There are no web fonts, so there is no fallback metric
  mismatch. See [fonts-css.md](./fonts-css.md).

## Related

- [README.md](./README.md)
- [images.md](./images.md)
- [measurement.md](./measurement.md) — the CLS threshold
