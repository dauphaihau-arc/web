<script lang="ts" setup>
import { formatMinorCurrency } from '@arc/utils'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import DashboardPanel from './dashboard-panel.vue'
import type { ShopDashboardResponse } from '~/domains/shop/api/dashboard/contracts/dashboard.contract'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  products: ShopDashboardResponse['top_selling_products']
  loading: boolean
}>()

type TopProductRow = {
  id: string
  title: string
  imageUrl?: string
  quantitySold: number
  orderCount: number
  revenue: string
  raw: ShopDashboardResponse['top_selling_products'][number]
}

const rows = computed<TopProductRow[]>(() =>
  props.products.map(product => ({
    id: product.product_id,
    title: product.title,
    imageUrl: product.image_url,
    quantitySold: product.quantity_sold,
    orderCount: product.order_count,
    revenue: formatMinorCurrency(product.revenue_minor, product.currency),
    raw: product,
  })),
)

const columns = [
  { key: 'title', label: 'Product' },
  { key: 'quantitySold', label: 'Sold' },
  { key: 'orderCount', label: 'Orders' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'actions' },
]

const tableUi = {
  divide: 'divide-y divide-border-subtle',
  tbody: 'divide-y divide-border-subtle',
} as const
</script>

<template>
  <DashboardPanel
    title="Top selling products"
    description="Ranked by units sold in the selected period."
  >
    <template #header-end>
      <UButton
        :to="routes.products()"
        color="gray"
        variant="ghost"
        size="sm"
      >
        View products
      </UButton>
    </template>

    <UTable
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No paid product sales in this period.' }"
      :ui="tableUi"
    >
      <template #title-data="{ row }">
        <NuxtLink
          :to="routes.productDetail(row.id)"
          class="flex max-w-[260px] items-center gap-2"
        >
          <NuxtImg
            v-if="row.imageUrl"
            :src="row.imageUrl"
            :alt="row.title"
            width="50"
            height="50"
            class="size-[50px] shrink-0 rounded object-cover"
          />
          <div
            v-else
            class="grid size-[50px] shrink-0 place-items-center rounded bg-surface-muted text-text-muted"
          >
            <AppIcon
              name="i-heroicons-cube-20-solid"
              size="sm"
            />
          </div>
          <div class="truncate text-sm font-medium text-text-strong">
            {{ row.title }}
          </div>
        </NuxtLink>
      </template>

      <template #quantitySold-data="{ row }">
        <div class="text-sm text-text-subtle">
          {{ row.quantitySold }}
        </div>
      </template>

      <template #orderCount-data="{ row }">
        <div class="text-sm text-text-subtle">
          {{ row.orderCount }}
        </div>
      </template>

      <template #revenue-data="{ row }">
        <div class="font-medium text-text-strong">
          {{ row.revenue }}
        </div>
      </template>

      <template #actions-data="{ row }">
        <div class="flex w-full items-center justify-end">
          <UTooltip text="Edit product">
            <UButton
              :to="routes.productDetail(row.id)"
              color="gray"
              variant="ghost"
              class="p-1.5"
            >
              <AppIcon
                name="edit"
                class="cursor-pointer"
              />
            </UButton>
          </UTooltip>
        </div>
      </template>

      <template #empty-state>
        <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AppIcon
            name="i-heroicons-archive-box-20-solid"
            size="lg"
            class="text-text-muted"
          />
          <div class="text-sm text-text-muted">
            No paid product sales in this period.
          </div>
        </div>
      </template>

      <template #loading-state>
        <div class="grid h-56 w-full place-content-center">
          <LoadingSvg :child-class="'!w-12 !h-12'" />
        </div>
      </template>
    </UTable>
  </DashboardPanel>
</template>
