<script lang="ts" setup>
import KpiCards from './_components/kpi-cards.vue'
import RecentOrders from './_components/recent-orders.vue'
import RevenueChart from './_components/revenue-chart/revenue-chart.vue'
import TimeRangeTabs from './_components/time-range-tabs.vue'
import TopProducts from './_components/top-products.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { useShopDashboard } from '~/domains/shop/queries/dashboard.query'
import type { ShopDashboardTimeRange } from '~/domains/shop/api/dashboard/contracts/dashboard.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const selectedRange = ref<ShopDashboardTimeRange>('last_7_days')

const dashboardParams = computed(() => ({
  range: selectedRange.value,
}))

const {
  data: dashboard,
  isPending,
  isFetching,
} = useShopDashboard(dashboardParams)

const loading = computed(() => isPending.value || isFetching.value)

const dashboardCurrency = computed(() =>
  dashboard.value?.summary.currency ?? 'USD',
)
</script>

<template>
  <LayoutShopWrapperContent content-class="space-y-6 pb-20">
    <template #title>
      Dashboard
    </template>
    <template #description>
      Track sales, order activity, and product performance.
    </template>
    <template #content>
      <TimeRangeTabs v-model="selectedRange" />

      <KpiCards
        :summary="dashboard?.summary"
        :loading="loading"
      />

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
        <RevenueChart
          :points="dashboard?.revenue_series ?? []"
          :currency="dashboardCurrency"
          :loading="loading"
        />

        <RecentOrders
          :orders="dashboard?.recent_orders ?? []"
          :loading="loading"
        />
      </div>

      <TopProducts
        :products="dashboard?.top_selling_products ?? []"
        :loading="loading"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
