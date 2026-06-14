# Arc Web Monorepo

Nuxt monorepo for ARC web applications and shared frontend packages.

## Layout

```text
apps/
  storefront
  seller
  admin
packages/
```

## Current status

- `apps/storefront` is the customer-facing web app.
- `apps/seller` is the seller-facing web app.
- `apps/admin` is reserved for a future app.
- `packages/` contains shared frontend code used by multiple apps.

## Implemented Patterns and Capabilities

### Architecture

- **Multi-app Nuxt monorepo** - buyer-facing storefront and seller-facing dashboard live as separate Nuxt applications in one workspace, with `admin` reserved for a future internal app
- **Shared package boundaries** - reusable frontend contracts, schemas, models, enums, utilities, API client code, and UI primitives are extracted into `packages/*` so apps can share low-level code without sharing page-level features
- **App-local plus shared structure** - each app keeps its own `app/*` surface for pages, layouts, middleware, and plugins while reusing common code from `shared/*` and workspace packages
- **Alias-based workspace imports** - apps consume shared packages through stable `@arc/*` aliases rather than deep relative imports, which keeps package boundaries explicit
- **Thin-page direction** - the codebase favors keeping Vue page and component files focused on rendering and user actions while reusable state and orchestration move into composables, stores, and shared modules

### Frontend Platform

- **Nuxt 3 application model** - both apps use Nuxt 3 with a consistent app directory layout, plugin registration, middleware loading, and auto-imported composables
- **SSR and static rendering split by app** - storefront is optimized for mixed rendering with SSR and route-level ISR, while seller runs as a client-rendered operational app
- **Route-level rendering rules** - storefront uses Nuxt route rules to mix ISR, SSR, and client-only flows depending on the route
- **Shared state management** - Pinia stores are registered from shared store directories so state patterns stay consistent across apps
- **Server-state fetching** - Vue Query integration supports async server-state caching and request lifecycle handling in both apps
- **Internationalization** - both apps support localized content through Nuxt i18n with lazy-loaded locale files and shared locale structure
- **Shared UI foundation** - `@nuxt/ui`, workspace UI packages, and app-local components provide a common component base across apps
- **Image and asset host configuration** - apps support environment-driven asset hosting and consistent image resolution behavior
- **Code splitting and lazy loading** - Nuxt route-based chunking is supplemented with lazy-loaded interaction-heavy UI and large product-management surfaces so non-critical code is fetched on demand
- **Bundle chunk optimization** - Vite/Rollup manual chunk rules split large shared dependencies such as workspace UI, Nuxt UI, Vue Query, and `dayjs` into more stable, cacheable bundles

### Security and Operations

- **Runtime configuration by environment** - API base URLs, app-to-app links, asset hosts, and other public runtime settings are injected per environment rather than hardcoded
- **Security middleware baseline** - both apps include `nuxt-security` so headers and related protections are managed consistently from the framework layer
- **Type-safe frontend baseline** - strict TypeScript, shared schemas, and shared contracts reduce drift between apps and backend integrations
- **App-aware CI validation** - GitHub Actions run lint, typecheck, test, and build only for the affected apps or shared packages
- **Independent Netlify deployment targets** - storefront and seller deploy as separate Netlify sites, each with app-local configuration and ignore rules to avoid unnecessary builds
- **Local quality gates** - Husky and lint-staged enforce lightweight local checks before changes are committed

## Requirements

- Node.js `20.20.2`
- PNPM `8.13.1`

## Common commands

Run these from `apps/web`.

- Start storefront: `pnpm dev:storefront`
- Start seller: `pnpm dev:seller`
- Build an app: `pnpm build:<app>`
- Generate static output: `pnpm generate:<app>`
- Preview a built app: `pnpm preview:<app>`
- Typecheck an app: `pnpm typecheck:<app>`
- Test an app: `pnpm test:<app>`
- Lint an app: `pnpm lint:<app>`
- Auto-fix lint issues: `pnpm lint:fix:<app>`

Available app names:

- `storefront`
- `seller`

Shared package commands:

```bash
pnpm lint:packages
pnpm lint:packages:fix
```

Legacy root aliases remain available for convenience and currently point to `storefront`:

```bash
pnpm build
pnpm generate
pnpm preview
pnpm start
pnpm typecheck
pnpm test
pnpm lint
pnpm lint:fix
```

## Local quality gates

- `husky` installs Git hooks through `pnpm prepare`
- `pre-commit` runs `pnpm lint-staged`
- full validation runs in GitHub Actions CI rather than `pre-push`

## CI/CD

### CI

GitHub Actions runs app-aware validation:

- `storefront` changes run storefront lint, typecheck, test, and build
- `seller` changes run seller lint, typecheck, test, and build
- shared `packages/*` changes trigger both app pipelines

### Deployment

The web apps deploy to Netlify as two separate sites from the same repository.

- storefront site builds `apps/storefront`
- seller site builds `apps/seller`
- each site uses an app-local `netlify.toml` with ignore rules so unrelated pushes can be skipped

See [docs/deployment.md](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/docs/deployment.md:1) for the current deployment setup.
