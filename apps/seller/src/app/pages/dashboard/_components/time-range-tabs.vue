<script lang="ts" setup>
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import type { ShopDashboardTimeRange } from '~/domains/shop/api/dashboard/contracts/dashboard.contract'

const model = defineModel<ShopDashboardTimeRange>({ default: 'last_7_days' })

const tabs = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'Last 30 days', value: 'last_30_days' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'All time', value: 'all_time' },
] satisfies Array<{ label: string, value: ShopDashboardTimeRange }>

function handleChange(value: string | number) {
  const tab = tabs.find(item => item.value === value)

  if (tab) {
    model.value = tab.value
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <AppTabs
      aria-label="Dashboard time range"
      :items="tabs"
      :model-value="model"
      @change="handleChange"
    />
  </div>
</template>
