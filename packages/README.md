# Shared Packages

Workspace packages used by `apps/seller`, `apps/storefront`, and `apps/admin`. They are source-level TypeScript packages linked through `pnpm` workspaces; there is no separate build step.

## Packages

| Package | Role |
|---|---|
| `@arc/ui` | Design system: tokens, generated CSS, Nuxt UI theme, primitives, patterns, shells, input directives |
| `@arc/schemas` | Zod schemas for API payloads and forms, plus the generated API types under `src/api/generated/` |
| `@arc/contracts` | Shared TypeScript contracts, including the list response envelope and request params |
| `@arc/models` | Domain model types shared across apps |
| `@arc/enums` | Hand-written enums checked for conformance against the API spec |
| `@arc/utils` | Pure helpers: money, currency formatting, shipping estimates, labels |
| `@arc/composables` | Cross-app Vue composables, such as backend status |
| `@arc/lib` | Runtime infrastructure: API client, error helpers, backend wake-up detection, browser and chat helpers, logger |
| `@arc/nuxt-vue-query` | Nuxt module wiring Vue Query: dehydrated cache, auto-imports, query-client defaults |
| `@arc/eslint-config` | Shared ESLint configuration |

## Resolution

Every package declares an `exports` map pointing at `src`. Library packages expose `"."` → `./src/index.ts` and `"./*"` → `./src/*`; `@arc/ui` exposes tier globs (`./primitives/*`, `./patterns/*`, `./shells/*`, `./features/*`) plus explicit `foundation/*` and directive entries instead of a root entry. Apps also alias the heavily used packages in `nuxt.config.ts`:

```ts
alias: {
  '@arc/ui': `${packagesDir}ui/src`,
  '@arc/contracts': `${packagesDir}contracts/src`,
  '@arc/models': `${packagesDir}models/src`,
  '@arc/enums': `${packagesDir}enums/src`,
  '@arc/schemas': `${packagesDir}schemas/src`,
  '@arc/utils': `${packagesDir}utils/src`,
}
```

`@arc/ui` resolves through its tier-level `exports` for importers; the Nuxt alias plus `components` registration (`packages/ui/src`, `pathPrefix: false`, `extensions: ['.vue']`) still handles auto-import and Tailwind scanning. `@arc/lib` and `@arc/composables` resolve through their workspace `exports`.

## Rules

- Packages must not import app source; `pnpm check:architecture` enforces this.
- Generated API types live in `packages/schemas/src/api/generated/`. Never edit them; regenerate with `pnpm generate:api-types`.
- Keep product workflows in the owning app. See `docs/architecture/design-system/design-system.md` for the UI promotion ladder and `docs/fe-type-boundaries.md` for the schema/contract/model split.
- Add a dependency on a package only when the app uses it; do not rely on transitive workspace links.

## Commands

```bash
pnpm lint:packages
pnpm lint:packages:fix
pnpm typecheck:packages
pnpm test:packages
pnpm check:architecture
pnpm check:shared-ui
pnpm generate:api-types
pnpm --filter @arc/ui generate:tokens
```

`pnpm typecheck:packages` runs every package's own check. Each package `tsconfig.json` extends `packages/tsconfig.base.json`, which maps `@arc/*` imports to package sources; Nuxt-dependent packages add a local shim for their runtime globals (`nuxt-app.d.ts`, `nuxt-types.d.ts`, `nuxt-auto-imports.d.ts`). Package test files are included in the program.

## Related Docs

- `docs/architecture/monorepo.md`
- `docs/architecture/design-system/design-system.md`
- `docs/architecture/design-system/design-tokens.md`
- `docs/fe-type-boundaries.md`
