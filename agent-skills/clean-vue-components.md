# Clean Vue Components

Rule: keep Vue single-file components focused on rendering, bindings, and user-triggered actions. Move static catalogs, derived option builders, normalization rules, and reusable state orchestration into nearby modules or composables.

Bad:

```ts
<script setup lang="ts">
const currencyLabelById = {
  USD: '$ United States Dollar (USD)',
  EUR: '€ Euro (EUR)',
}

function localeToLanguageOption(locale: string) {
  // mapping logic
}

const state = reactive({
  region: 'US',
  language: 'en',
  currency: 'USD',
})

watch(currentUserPreferences, (preferences) => {
  // hydrate state
}, { immediate: true })

watch(selectedMarket, (market) => {
  // normalize currency/language
}, { immediate: true })

const onSubmit = async () => {
  // persist
  // invalidate queries
  // close modal
}
</script>
```

Use this instead:

```ts
<script setup lang="ts">
import { useUserPreferenceForm } from './use-user-preference-form'
import { currencyOptionsById } from './preference-options'

const {
  state,
  regionOptions,
  currencyOptions,
  selectedCurrencyOption,
} = useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
})

const onSubmit = async () => {
  // submit flow only
}
</script>
```

Preferred split:
- component `.vue`: template, UI bindings, emitted events, submit and click handlers
- local composable: state hydration, derived options, normalization rules, watcher orchestration
- local constants/module: static labels, option catalogs, formatter helpers
- shared module: only promote logic upward when more than one feature uses it

Local file structure:
- if a component needs feature-private support files such as a local composable, helper, constants module, or subcomponent, convert the component from a single file into a folder
- keep the main entry component as `component-name/component-name.vue`
- place feature-private files beside it, such as `component-name/use-component-name.ts`, `component-name/component-name.constants.ts`, or `component-name/_components/...`
- do not create a folder when the component is still a single standalone `.vue` file with no local support files
- do not promote feature-private files into shared directories just to avoid creating a local component folder

Guidelines:
- if a `<script setup>` block starts carrying catalogs, mappers, multiple watchers, and submit side effects together, split it
- avoid parsing display values from labels in the template; store explicit fields like `symbol`, `label`, `id`
- prefer one explicit normalization path over multiple watchers that mutate the same state indirectly
- keep dead commented code only when it is intentionally preserved for upcoming work; otherwise remove it

Performance and delivery:
- splitting logic out of a component improves readability, but it does not reduce client bundle cost by itself
- use lazy loading when a component or feature is not needed for initial render, especially dialogs, drawers, popovers, chat panels, heavy forms, and admin-only tools
- prefer async components or dynamic `import()` at interaction boundaries, such as opening a modal, expanding a secondary panel, or entering a large management route
- keep route-level code splitting intact by avoiding unnecessary eager imports from global layouts, headers, and always-mounted shells
- group large shared dependencies into stable chunks only when the default bundler output is producing oversized common bundles; use manual chunking for large shared UI or vendor libraries, not for every small helper
- do not confuse composable extraction with bundle optimization: moving code from `.vue` to `.ts` still ships eagerly if the module is imported eagerly

Examples:

```ts
// Good: load only when the dialog is opened
const showPreferencesDialog = async () => {
  const dialog = await import('./preferences-dialog.vue')
  modal.open(dialog.default)
}
```

```ts
// Good: split a heavy route surface behind an async boundary
const ProductEditor = defineAsyncComponent(() => import('./product-editor.vue'))
```

```ts
// Not enough: cleaner structure, but still eager in the initial bundle
import { useProductEditorForm } from './use-product-editor-form'
```

Reason:
- keeps components easier to scan
- reduces watcher-driven state coupling
- makes domain rules testable outside the template
- keeps refactors local by default without over-promoting feature-specific logic
- makes component-private files easier to discover by keeping them under one local boundary
- makes it explicit when a refactor is only about code shape versus when it also improves shipped bundle behavior
