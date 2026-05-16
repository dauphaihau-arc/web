# Nuxt Auto Imports In This App

This note is based on [`nuxt.config.ts`](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/nuxt.config.ts).

## Auto-imported

### Nuxt built-ins

Nuxt auto-imports its usual built-ins, such as:

- Vue macros in SFCs like `ref`, `computed`, `watch`, `onMounted`
- Nuxt composables like `useRoute`, `useRouter`, `useRuntimeConfig`, `navigateTo`

This is standard Nuxt behavior and does not need extra config in this project.

### Shared UI components

This directory is configured for component auto-registration:

- `src/shared/ui`

Because `pathPrefix: false` is set, component names are not namespaced by folder path.

### Composables and utils

These directories are configured for function auto-imports:

- `src/shared/composables`
- `src/shared/utils`

That means exported functions from files in those folders can usually be used without manual import statements.

### Pinia stores

Pinia store files are also configured in this project:

- `src/shared/stores/**`

Treat store definitions in that directory as auto-imported.

## Explicit imports required

### App components

Even though `nuxt.config.ts` registers `src/app/components` in the `components` option, the project rule is:

- all components in `src/app/components` should be imported explicitly

Treat `src/app/components` as **manual import only** in app code.

### Other non-auto-import areas

These areas are **not** declared in `imports.dirs` for symbol auto-imports, so do not assume auto-import just from this config:

- `src/shared/services`
- `src/shared/lib`
- `src/shared/types`
- `src/shared/constants`
- `src/app/pages`
- `src/app/plugins`

For these, use normal explicit imports unless another library provides its own auto-import behavior.

## Special cases

### Module-provided auto-imports

Some modules in `modules` may provide their own auto-imports, for example:

- `@vueuse/nuxt`
- `@nuxt/ui`
- `@hebilicious/vue-query-nuxt`
- `@samk-dev/nuxt-vcalendar`

Those auto-imports come from the module itself, not from this app-level `imports.dirs` setting.

If you want certainty for a specific symbol from one of those modules, check that module's docs or verify usage in the codebase.

## Practical rule

You can usually skip imports for:

- Nuxt/Vue built-ins
- components from `src/shared/ui`
- exports from `src/shared/composables`
- exports from `src/shared/utils`
- store definitions from `src/shared/stores/**`

You should add explicit imports for:

- all components from `src/app/components`
- everything outside the configured auto-import directories unless a module provides its own auto-imports
