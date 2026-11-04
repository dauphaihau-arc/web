<script lang="ts" setup>
import type { OrderStatuses } from '@arc/enums/order'
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import type { AppTabsItem } from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import { orderStatusTabOptions } from './order-status-filter-options'
import type { ListShopOrdersResponse } from '~/domains/shop/api/order/contracts/order.contract'

type StatusCounts = ListShopOrdersResponse['status_counts']

/** Sentinel for "All": the filter model keeps an empty array for no status filter. */
const ALL_TAB = 'all'
/** Sentinel that matches no tab, used while multiple statuses are selected. */
const NONE_TAB = ''

const props = defineProps<{
  counts?: StatusCounts
}>()

const model = defineModel<OrderStatuses[]>({ default: () => [] })

const tabs = computed<AppTabsItem[]>(() => [
  {
    label: 'All',
    value: ALL_TAB,
    badge: props.counts?.all ?? 0,
  },
  ...orderStatusTabOptions.map(option => ({
    label: option.label,
    value: option.value as OrderStatuses,
    badge: props.counts?.[option.value as keyof StatusCounts] ?? 0,
  })),
])

const activeTab = computed<string | number>(() => {
  if (model.value.length === 0) {
    return ALL_TAB
  }

  return model.value.length === 1 ? model.value[0] : NONE_TAB
})

function handleChange(value: string | number) {
  model.value = value === ALL_TAB ? [] : [value as OrderStatuses]
}
</script>

<template>
  <AppTabs
    aria-label="Order status"
    class="mb-4"
    :items="tabs"
    :model-value="activeTab"
    @change="handleChange"
  />
</template>
