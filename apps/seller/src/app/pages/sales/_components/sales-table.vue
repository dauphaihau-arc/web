<script setup lang="ts">
import { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import FixedPagination from '~/shared/ui/fixed-pagination.vue'
import { useShopGetSales } from '~/domains/shop/queries/sales.query'

const pageCount = 10
const page = ref(1)

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
}))

const {
  isPending: isPendingSales,
  data: salesData,
  refetch: refetchSales,
} = useShopGetSales(params)

const statusLabels: Record<PromotionStatus, string> = {
  [PromotionStatus.SCHEDULED]: 'Scheduled',
  [PromotionStatus.ACTIVE]: 'Active',
  [PromotionStatus.ENDED]: 'Ended',
  [PromotionStatus.CANCELLED]: 'Cancelled',
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'discount', label: 'Discount', class: 'text-center' },
  { key: 'products', label: 'Products', class: 'text-center' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'status', label: 'Status', class: 'text-center' },
]

/**
 * Renders an instant on the wall clock of the timezone the schedule was
 * authored in, so a seller who travels still sees the schedule they set.
 */
function formatSchedule(instant: string | Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(instant))
}

const rows = computed(() =>
  (salesData.value?.results ?? []).map(sale => ({
    ...sale,
    discount: `${sale.percent_off}%`,
    products: sale.product_scope === PromotionProductScope.ALL
      ? 'All products'
      : `${sale.product_ids.length} ${sale.product_ids.length === 1 ? 'product' : 'products'}`,
    schedule: `${formatSchedule(sale.start_at, sale.timezone)} – ${formatSchedule(sale.end_at, sale.timezone)}`,
    statusLabel: statusLabels[sale.status] ?? sale.status,
  })),

)

function handlePageChange(nextPage: number) {
  page.value = nextPage
  refetchSales()
}
</script>

<template>
  <div>
    <DataTable
      :empty-state="{ icon: 'i-heroicons-tag-20-solid', label: 'No sales.' }"
      :rows="rows"
      :columns="columns"
      :loading="isPendingSales"
    >
      <template #status-data="{ row }">
        <div class="text-center text-sm">
          {{ row.statusLabel }}
        </div>
      </template>

      <template #loading-state>
        <div class="grid h-[80vh] w-full place-content-center">
          <LoadingSvg :child-class="'!w-12 !h-12'" />
        </div>
      </template>
    </DataTable>

    <FixedPagination
      :page="page"
      :page-count="pageCount"
      :total="salesData?.total_results ?? 0"
      @on-change-page="handlePageChange"
    />
  </div>
</template>
