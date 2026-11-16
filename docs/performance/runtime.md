# Runtime And Framework

Interaction-time cost, as opposed to download cost.

## Megamenus

`apps/storefront/src/app/layouts/market/header/header.vue` loads the cart and
search-all megamenus as `defineAsyncComponent` and triggers the import on hover,
focus, or first toggle — never on mount. Both render only at `lg` and above; below
that the full-screen panels are used. The chunk is fetched when intent is shown,
so the header's first paint does not pay for two overlays most visitors never open.

## Long Lists

Listings paginate through the URL (`page` parameter), so a page never renders an
unbounded list and virtualization is not installed. A surface that starts
rendering an unpaginated collection is a new decision, not an existing pattern.

## Related

- [README.md](./README.md)
- [javascript.md](./javascript.md) — what ships and what waits
- [measurement.md](./measurement.md) — where a profile would come from
