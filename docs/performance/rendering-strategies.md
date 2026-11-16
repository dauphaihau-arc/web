# Rendering Strategies

Arc Web uses different rendering strategies depending on the product surface, route behavior, SEO value, and amount of user-specific state.

## Goals

- Use server rendering where SEO, initial content, or request-specific output matters.
- Use incremental or static rendering where public pages can be cached safely.
- Use client rendering for authenticated, highly interactive, or browser-state-heavy flows.
- Keep rendering choices explicit at the app or route level.

## Storefront

Storefront is the customer marketplace and benefits from mixed rendering. Public discovery and landing routes can use SSR, ISR, or static output when the content should be fast and indexable.

Interactive customer flows should prefer client rendering when they depend heavily on session state, cart state, checkout state, browser APIs, or post-action UI.

Storefront applies these rules in `apps/storefront/nuxt.config.ts`:

| Route class | Rule | Why |
|---|---|---|
| `/` | `isr: 3600` | public landing page, cacheable for an hour |
| `/**` | `isr: 300` | public routes, five-minute cache default |
| `/c/:slug-c:publicId`, `/search` | `ssr: true`, `isr: false`, `cache: false` | identity and filters resolve per request; results must not be shared through ISR. Category identity is parsed from the URL against the API before rendering |
| cart, checkout, account, orders, guest orders, messages, reset, success | `ssr: false`, ISR and Nitro cache disabled | session- and browser-state-driven flows |

Public landing and catalog content can also use static generation when it is stable enough to build ahead of time. Category listings cannot: they must return authoritative `301`, `404`, and backend errors, which static or cached HTML cannot do.

## Seller

Seller is an authenticated operational dashboard. SEO is not a priority, and most data is user-specific or shop-specific.

It is client-rendered by default — `routeRules` `'/**': { ssr: false }` — with an explicit allowlist for the routes where the auth redirect or page shell must arrive in the first response:

- `/login`, `/register` — a request carrying a session redirects before any HTML is sent.
- `/dashboard`, `/orders`, `/orders/*`, `/sales`, `/promo-codes`, `/settings/shipping`, `/products`, `/products/*` — deep links resolve to real HTML in one round trip instead of a client-side auth waterfall.

Long-lived editor and import flows (`/products/new`, `/products/import`) are re-declared as `ssr: false` after the product rules, so they stay client-rendered.

## Admin

Admin follows the same posture as Seller: client-rendered by default, server-rendered on `/login` and the order and shop surfaces (`/orders`, `/orders/*`, `/shops`, `/shops/*`, `/shops/**`). A link from an order resolves to real HTML in one round trip; everything else renders on the client.

## Static Generation

Static generation remains available for routes that can be built ahead of time. Use it when content is public, stable enough to cache, and does not require request-specific user state.

## Cost Model

SSR buys a one-round-trip deep link and costs a server render per request. ISR buys
cached HTML and costs staleness. CSR costs a client auth or data waterfall. Only the
routes where the trade pays belong on an SSR allowlist; the fetch budgets that keep
an SSR render bounded are in [data-fetching.md](./data-fetching.md).

## Decision Guide

Use SSR when a page needs server-rendered request-specific content.

Use ISR or static generation when public content can be cached and refreshed without rebuilding the whole app.

Use CSR when the page is authenticated, interaction-heavy, or dependent on browser-only state.

## Related

- [README.md](./README.md)
- [data-fetching.md](./data-fetching.md) — server fetch budgets
- [measurement.md](./measurement.md) — how ISR correctness is verified
- `docs/deployment.md`
