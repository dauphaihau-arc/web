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

Typical Storefront split:

- public landing and catalog content: SSR, ISR, or static generation
- search and request-specific discovery: SSR
- cart, checkout, account, and orders: CSR

## Seller

Seller is an authenticated operational dashboard. SEO is not a priority, and most data is user-specific or shop-specific.

Seller can run as a client-rendered app by default unless a route has a specific reason to render on the server.

## Static Generation

Static generation remains available for routes that can be built ahead of time. Use it when content is public, stable enough to cache, and does not require request-specific user state.

## Decision Guide

Use SSR when a page needs server-rendered request-specific content.

Use ISR or static generation when public content can be cached and refreshed without rebuilding the whole app.

Use CSR when the page is authenticated, interaction-heavy, or dependent on browser-only state.

## Related Docs

- `docs/architecture/overview.md`
- `docs/architecture/application-structure.md`
- `docs/deployment.md`
