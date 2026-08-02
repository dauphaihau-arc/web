<script lang="ts" setup>
import { formatMinorCurrency } from '@arc/utils'
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants'
import type { ShopDashboardResponse } from '~/domains/shop/api/dashboard/contracts/dashboard.contract'

const props = defineProps<{
  summary?: ShopDashboardResponse['summary']
  loading: boolean
}>()

type KpiCardIcon = Extract<
  AppIconAlias,
  'revenue' | 'orders' | 'product' | 'averageOrder'
>

type KpiCard = {
  label: string
  value: string
  icon: KpiCardIcon
}

const cards = computed<KpiCard[]>(() => {
  const summary = props.summary
  const currency = summary?.currency ?? 'USD'

  return [
    {
      label: 'Revenue',
      value: formatMinorCurrency(summary?.revenue_minor ?? 0, currency),
      icon: 'revenue',
    },
    {
      label: 'Orders',
      value: String(summary?.order_count ?? 0),
      icon: 'orders',
    },
    {
      label: 'Units sold',
      value: String(summary?.items_sold ?? 0),
      icon: 'product',
    },
    {
      label: 'Average order',
      value: formatMinorCurrency(summary?.average_order_value_minor ?? 0, currency),
      icon: 'averageOrder',
    },
  ]
})
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-lg border border-border-subtle bg-surface p-4"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm font-medium text-text-muted">
          {{ card.label }}
        </div>
        <div class="grid size-9 place-items-center rounded-lg bg-surface-muted text-text-subtle">
          <AppIcon
            :name="card.icon"
            size="sm"
          />
        </div>
      </div>
      <USkeleton
        v-if="loading"
        class="mt-5 h-8 w-28"
      />
      <div
        v-else
        class="mt-5 truncate text-2xl font-semibold text-text-strong"
      >
        {{ card.value }}
      </div>
    </div>
  </div>
</template>
