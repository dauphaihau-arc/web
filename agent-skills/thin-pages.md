# Thin Pages

Rule: keep files under `pages/` focused on route ownership. A page should read route params, load initial data, set page meta or SEO, choose layout wrappers, and compose higher-level sections. Do not let page files become the implementation layer.

Bad:

```ts
<script setup lang="ts">
const selected = ref([])
const page = ref(1)
const statusFilter = ref()
const slideoverOpen = ref(false)

const rows = computed(() => {
  // map API data into table rows
})

function statusTone(status) {
  // UI mapping
}

function handleBulkAction() {
  // mutation flow
  // success/error feedback
}
</script>

<template>
  <DataTable>
    <template #customer-data="{ row }">
      <!-- nested table cell rendering -->
    </template>
    <template #status-data="{ row }">
      <!-- more implementation -->
    </template>
  </DataTable>

  <USlideover>
    <DetailPanel />
  </USlideover>
</template>
```

Use this instead:

```ts
<script setup lang="ts">
import OrdersPageContent from './_components/orders-page-content.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const entityId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <PageLayout>
    <template #title>
      Orders
    </template>

    <template #content>
      <OrdersPageContent :entity-id="entityId" />
    </template>
  </PageLayout>
</template>
```

Preferred split:
- page file: route params, `definePageMeta`, initial data loading, page-level error handling, layout composition
- page-local `_components/`: single-page components such as table markup, form markup, slideover/modal content, section layout, user interactions
- local composable or nearby module: derived rows, filters, tab state, mutation orchestration, formatting helpers
- shared module: only when the same logic or UI is reused across multiple pages or flows

When a component belongs to only one page:
- do not keep it inline in the page just because it is single-use
- extract it from the page once the markup or logic becomes non-trivial
- place it in that page's `_components/` folder, for example `pages/index/_components/`
- promote it to shared only when reuse actually appears

Guidelines:
- pages should usually stay close to route-controller size: mostly imports, params, loaders, meta, and section composition
- if a page starts carrying big table slot templates, row mappers, status-to-color maps, modal state, or bulk action flows, move that down
- pages may coordinate multiple sections, but those sections should own their internal UI depth
- page-specific does not automatically mean `features/`; start with the page-local `_components/` pattern and promote only when the component becomes cross-page

Reason:
- keeps routing concerns separate from feature implementation
- makes large pages easier to scan and safer to change
- avoids turning `pages/` into a second components layer with hidden business logic
- matches the existing local page composition pattern without forcing a top-level `features/` convention
