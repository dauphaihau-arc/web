# Reduce JavaScript

Nuxt splits by route by default, so the client only downloads the route it is on.
Everything below removes work from the routes that are already downloaded.

Limits are in `performance-budgets.json`; see [README.md](./README.md) §Budgets.

## Below The Fold

Seven sections below the first home rail are declared with
`defineLazyHydrationComponent('visible', …)` (Nuxt 4's built-in lazy hydration) in
`apps/storefront/src/app/pages/index/index.vue`. Both the chunk and the section's
query setup wait for the section to scroll into view, so the route does not ship
all eight implementations and their queries up front.

Anything added below the fold follows this pattern instead of a plain static
import.

## Icons

Icons are bundled, not fetched: `clientBundle.scan` plus the curated list in
`packages/ui/src/foundation/app-icon.constants.ts`, with `fallbackToApi: false` in
all three apps. `localApiEndpoint` exists only for the local icon source used at
build time, and must not point at `/api/**`, which proxies to the API.

## Third-Party Scripts

None are installed — no analytics, chat, or ad tags — and `@nuxt/scripts` is not
part of the stack. Adding one is a performance decision that needs its own PR and
a budget note.

## Libraries

No client-side performance library. Solve the measured cause: a smaller payload, a
deferred chunk, or a server prefetch. A new dependency that only moves work around
still costs download time.

## Related

- [README.md](./README.md)
- [runtime.md](./runtime.md) — megamenus, deferred interaction cost
- [data-fetching.md](./data-fetching.md) — moving fetches to the server
