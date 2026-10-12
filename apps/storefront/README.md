# Arc
A ecommerce marketplace web application  where people come together to make, sell, buy, and collect unique items

## Tech stack

- [Nuxt.js](https://nuxt.com/) - Vue Framework
- [Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview) - Managing and caching asynchronous data
- [Pinia](https://pinia.vuejs.org/) - State management
- [Typescript](https://www.typescriptlang.org/) - Static Type Checking
- [Tailwind](https://tailwindcss.com/) - Utility-first CSS framework
- [Zod](https://zod.dev/) - TypeScript-first schema declaration and validation
- [Vitest](https://vitest.dev/) - Testing Framework

## Rendering and session recovery

- Home uses one-hour ISR; other public routes retain the five-minute ISR default.
- Category listings (`/c/**`) and search use uncached SSR so market and filter results are not shared through ISR.
- Success, guest orders, cart, checkout, account, orders, and password reset remain client-rendered with ISR and Nitro caching explicitly disabled.
- Both current-user API methods enable refresh/retry in the browser. Recoverable access-token errors use the shared API client's cookie refresh flow before retrying the lookup; rejected refreshes leave the guest lookup unauthenticated.
- Current-user requests do not refresh during SSR. This does not add server-side session rotation or cookie forwarding.

## Category URLs and resolution

- A category has one canonical flat URL: `/c/:slug-c:publicId`, with no trailing slash. `slug` is the current readable name segment and `publicId` is the permanent decimal public identity.
- The suffix is strict: the `c` marker is lowercase and `publicId` is a positive decimal with no leading zero, kept as a string so large identities are never rounded. A malformed segment is a genuine `404`.
- Identity is parsed from the URL only. Products, facets, and breadcrumbs never read session storage or navigation-created breadcrumbs, so direct access, reload, and shared links behave the same as in-app navigation.
- The `category` route middleware (`src/app/middleware/category.ts`) resolves identity during SSR through `GET /v1/categories/:id` before the page renders, so no listing or facet request is issued for a malformed, unknown, or unavailable category.
- The resolution response carries `{ category: { id, slug, name, featured_facet_keys? }, ancestry, canonical_path }`. `ancestry` is ordered root-to-current and includes the resolved category itself; every breadcrumb links to that ancestor's own canonical flat URL, and `canonical_path` is exposed as the page's `rel="canonical"` link.
- A visible category with no eligible products returns `200` with an empty state. A backend failure stays an error page rather than a fabricated `404`. An outdated client/backend identity contract renders the scoped update card instead of a not-found page.
- Category listing filters, sort, and page live in the URL query, which is the single source of truth: page 1 has no `page` parameter, other pages write `page=<n>` while preserving the rest of the query, and browser history paginates without a local copy to keep in sync.
- All category links (header, home root categories, recommendations, subcategories, and the product-detail breadcrumb) are generated through `buildCategoryPath` in `src/shared/navigation/route-paths.ts`, the single canonical URL policy.

## Installation Guide

1. **Clone the GitHub repository**
```bash
https://github.com/dauphaihau/arc-fe.git
```
2. **Install dependencies**
```bash
pnpm install
```
3. **Copy .env.example to .env and update the variables**

4. **Launches a dev server**
```bash
pnpm dev
```
