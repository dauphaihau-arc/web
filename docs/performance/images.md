# Images

`@nuxt/image` runs with `provider: 'none'` in all three apps: uploaded assets are
served as stored from `ASSET_HOST`, with the host exposed through runtime config
rather than hardcoded. There is no resize or format conversion in the request
path, so the size of the stored variant is the size the user downloads.

## Rules

- Use `ProductImage` / `<NuxtImg>`, not a raw `<img>`, for product and category
  media. Raw `<img>` is acceptable only for local previews (blob URLs) and remote
  avatars.
- Always pass `width` and `height` to reserve layout space.
- Pick the stored variant by name (`resolveProductImageUrl(..., 'card_1x1')` in
  `apps/storefront/src/domains/product/utils/product-image-url.ts`); the size
  comes from that variant, not from a transform.
- `densities="1"` for a single stored asset. The module defu-merges density arrays
  with its `[1, 2]` default, so omitting it emits a 2x candidate that does not
  exist on the asset host.
- `priority` only for the element that holds the LCP candidate. One per page.

## The LCP Image

`packages/ui/src/primitives/product-image.vue` maps `priority` to
`loading="eager"` and `fetchpriority="high"`. On the home route it is reached from
`ProductSection priority` → first `ProductCard` → `ProductCardImage`, and the
product data is prefetched on the server so the image is in the initial HTML. See
[data-fetching.md](./data-fetching.md) for the budget that makes this safe.

## Related

- [README.md](./README.md)
- [layout-stability.md](./layout-stability.md) — width/height and reserved geometry
- [data-fetching.md](./data-fetching.md) — first rail prefetch
