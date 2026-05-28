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

Guidelines:
- if a `<script setup>` block starts carrying catalogs, mappers, multiple watchers, and submit side effects together, split it
- avoid parsing display values from labels in the template; store explicit fields like `symbol`, `label`, `id`
- prefer one explicit normalization path over multiple watchers that mutate the same state indirectly
- keep dead commented code only when it is intentionally preserved for upcoming work; otherwise remove it

Reason:
- keeps components easier to scan
- reduces watcher-driven state coupling
- makes domain rules testable outside the template
- keeps refactors local by default without over-promoting feature-specific logic
