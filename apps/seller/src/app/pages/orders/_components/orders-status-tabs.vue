<script lang="ts" setup>
import type { OrderStatuses } from '@arc/enums/order'
import { orderStatusTabOptions } from './order-status-filter-options'
import type { ListShopOrdersResponse } from '~/shared/api/shop/order/contracts/order.contract'

type StatusCounts = ListShopOrdersResponse['status_counts']

const props = defineProps<{
  counts?: StatusCounts
}>()

const model = defineModel<OrderStatuses[]>({ default: () => [] })

const tabsKey = computed(() => JSON.stringify(props.counts ?? {}))

const tabs = computed(() => [
  {
    label: `All (${props.counts?.all ?? 0})`,
    value: 'all' as const,
  },
  ...orderStatusTabOptions.map(option => ({
    label: `${option.label} (${props.counts?.[option.value as keyof StatusCounts] ?? 0})`,
    value: option.value as OrderStatuses,
  })),
])

const activeTabIndex = computed(() => {
  if (model.value.length === 0) {
    return 0
  }

  if (model.value.length > 1) {
    return undefined
  }

  return tabs.value.findIndex(tab => tab.value === model.value[0])
})

function handleChange(index: number) {
  const nextTab = tabs.value[index]

  if (!nextTab) {
    return
  }

  model.value = nextTab.value === 'all' ? [] : [nextTab.value]
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
