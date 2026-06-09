<script lang="ts" setup>
import type { ProductStates } from '@arc/enums/product'
import { productStateFilterOptions } from './product-state-filter-options'
import type { ListShopProductsResponse } from '~/shared/api/shop/product/contracts/read.contract'

type StateCounts = ListShopProductsResponse['state_counts']

const props = defineProps<{
  counts?: StateCounts
}>()

const model = defineModel<ProductStates | undefined>()

const tabsKey = computed(() => JSON.stringify(props.counts ?? {}))

const tabs = computed(() => [
  {
    label: `All (${props.counts?.all ?? 0})`,
    value: undefined,
  },
  ...productStateFilterOptions.map(option => ({
    label: `${option.label} (${props.counts?.[option.value as keyof StateCounts] ?? 0})`,
    value: option.value,
  })),
])

const activeTabIndex = computed(() =>
  tabs.value.findIndex(tab => tab.value === model.value),
)

function handleChange(index: number) {
  model.value = tabs.value[index]?.value
}
</script>

<template>
  <div class="mb-4 overflow-x-auto">
    <UTabs
      :key="tabsKey"
      :items="tabs"
      :model-value="activeTabIndex"
      class="min-w-max"
      @change="handleChange"
    />
  </div>
</template>
