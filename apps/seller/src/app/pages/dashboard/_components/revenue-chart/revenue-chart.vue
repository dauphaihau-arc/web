<script lang="ts" setup>
import { Line } from 'vue-chartjs'
import DashboardPanel from '../dashboard-panel.vue'
import { useRevenueChart } from './_composables/use-revenue-chart'
import type { ShopDashboardResponse } from '~/domains/shop/api/dashboard/contracts/dashboard.contract'

const props = defineProps<{
  points: ShopDashboardResponse['revenue_series']
  currency: string
  loading: boolean
}>()

const {
  chartData,
  chartOptions,
  hasRevenue,
  maxRevenueLabel,
} = useRevenueChart(
  computed(() => props.points),
  computed(() => props.currency),
)
</script>

<template>
  <DashboardPanel
    title="Revenue"
    description="Gross paid sales trend."
    body-class="h-[300px]"
  >
    <template #header-end>
      <div class="text-right">
        <div class="text-xs font-medium uppercase text-text-muted">
          Peak
        </div>
        <div class="text-sm font-semibold text-text-strong">
          {{ maxRevenueLabel }}
        </div>
      </div>
    </template>

    <USkeleton
      v-if="loading"
      class="size-full"
    />
    <div
      v-else-if="!hasRevenue"
      class="grid h-full place-items-center rounded-lg border border-dashed border-border-subtle bg-surface-muted text-sm text-text-muted"
    >
      No paid revenue in this period.
    </div>
    <Line
      v-else
      :data="chartData"
      :options="chartOptions"
      class="size-full"
      aria-label="Revenue chart"
    />
  </DashboardPanel>
</template>
