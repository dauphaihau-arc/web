<script lang="ts" setup>
import type { ProductStates } from '@arc/enums/product'
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import type { AppTabsItem } from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import { productStateFilterOptions } from './product-state-filter-options'
import type { ListShopProductsResponse } from '~/domains/shop/api/product/contracts/read.contract'

type StateCounts = ListShopProductsResponse['state_counts']

/** Sentinel for "All": the model holds `undefined` when no state is filtered. */
const ALL_TAB = 'all'

const props = defineProps<{
  counts?: StateCounts
}>()

const model = defineModel<ProductStates | undefined>()

const tabs = computed<AppTabsItem[]>(() => [
  {
    label: 'All',
    value: ALL_TAB,
    badge: props.counts?.all ?? 0,
  },
  ...productStateFilterOptions.map(option => ({
    label: option.label,
    value: option.value as ProductStates,
    badge: props.counts?.[option.value as keyof StateCounts] ?? 0,
  })),
])

const activeTab = computed<string | number>(() => model.value ?? ALL_TAB)

function handleChange(value: string | number) {
  model.value = value === ALL_TAB ? undefined : value as ProductStates
}
</script>

<template>
  <div class="mb-4 overflow-x-auto">
    <AppTabs
      aria-label="Product state"
      :items="tabs"
      :model-value="activeTab"
      @change="handleChange"
    />
  </div>
</template>
