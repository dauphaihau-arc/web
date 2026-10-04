<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type { DropdownItem } from '#ui/types'
import FixedPagination from '~/shared/ui/fixed-pagination.vue'
import SelectionActionBar from '~/shared/ui/selection-action-bar.vue'
import { useShopGetSales } from '~/domains/shop/queries/sales.query'
import type { ShopSale } from '~/domains/shop/api/sale/contracts/sale.contract'
import { formatScheduleRange } from '~/domains/shop/utils/format-schedule-range'
import StopSaleDialog from './stop-sale-dialog.vue'
import BulkStopSalesDialog from './bulk-stop-sales-dialog.vue'

type SaleRow = ShopSale & {
  discount: string
  products: string
  schedule: string
  statusLabel: string
  statusTone: PromotionStatusTone
  /** Whether this Sale still has an action to offer. */
  stoppable: boolean
  actions: { class: string }
}

const pageCount = 10
const page = ref(1)
const dialog = useModal()

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

type PromotionStatusTone = 'blue' | 'green' | 'gray' | 'red'

/**
 * Lifecycle tone only: a Scheduled Sale is upcoming, an Active one is live,
 * an Ended one is spent, and a Cancelled one was withdrawn deliberately.
 */
const statusTones: Record<PromotionStatus, PromotionStatusTone> = {
  [PromotionStatus.SCHEDULED]: 'blue',
  [PromotionStatus.ACTIVE]: 'green',
  [PromotionStatus.ENDED]: 'gray',
  [PromotionStatus.CANCELLED]: 'red',
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'discount', label: 'Discount', class: 'text-center', rowClass: 'text-center' },
  { key: 'products', label: 'Products', class: 'text-center', rowClass: 'text-center' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'status', label: 'Status', class: 'text-center', rowClass: 'text-center' },
  { key: 'actions' },
]

/**
 * Only a scheduled Sale can be cancelled and only an active one can be ended.
 * Ended and cancelled Sales have reached a final state: they keep their
 * definition and history but offer no further action.
 */
function isStoppable(status: PromotionStatus): boolean {
  return status === PromotionStatus.SCHEDULED || status === PromotionStatus.ACTIVE
}

const rows = computed<SaleRow[]>(() =>
  (salesData.value?.results ?? []).map(sale => ({
    ...sale,
    discount: `${sale.percent_off}%`,
    products: sale.product_scope === PromotionProductScope.ALL
      ? 'All products'
      : `${sale.product_ids.length} ${sale.product_ids.length === 1 ? 'product' : 'products'}`,
    schedule: formatScheduleRange(sale.start_at, sale.end_at, sale.timezone),
    statusLabel: statusLabels[sale.status] ?? sale.status,
    statusTone: statusTones[sale.status],
    stoppable: isStoppable(sale.status),
    actions: { class: 'text-right' },
  })),
)

const selected = ref<SaleRow[]>([])

watch(rows, () => {
  selected.value = []
})

/**
 * Only a scheduled Sale can be cancelled and only an active one can be ended,
 * so the bulk action sends just those; ended and cancelled Sales keep their
 * final state.
 */
const stoppableSelected = computed(() =>
  selected.value.filter(sale => sale.stoppable),
)

function openStopSale(row: SaleRow) {
  dialog.open(StopSaleDialog, {
    saleId: row.id,
    action: row.status === PromotionStatus.SCHEDULED ? 'cancel' : 'end',
  })
}

function openBulkStop() {
  dialog.open(BulkStopSalesDialog, {
    ids: stoppableSelected.value.map(sale => sale.id),
    scheduledCount: stoppableSelected.value.filter(sale => sale.status === PromotionStatus.SCHEDULED).length,
    activeCount: stoppableSelected.value.filter(sale => sale.status === PromotionStatus.ACTIVE).length,
  })
}

/**
 * Only ever read for a stoppable row, so the single item is the
 * state-appropriate action: cancel a scheduled Sale, end an active one.
 */
function rowActions(row: SaleRow): DropdownItem[][] {
  return [[{
    label: row.status === PromotionStatus.SCHEDULED ? 'Cancel sale' : 'End sale',
    icon: ICON_NAME_BY_ALIAS.warning,
    click: () => openStopSale(row),
  }]]
}

function handlePageChange(nextPage: number) {
  page.value = nextPage
  refetchSales()
}
</script>

<template>
  <div>
    <SelectionActionBar
      :count="selected.length"
      @clear="selected = []"
    >
      <UButton
        color="red"
        variant="soft"
        :disabled="stoppableSelected.length === 0"
        @click="openBulkStop()"
      >
        Cancel sale
      </UButton>
    </SelectionActionBar>

    <DataTable
      v-model="selected"
      by="id"
      :empty-state="{ icon: 'i-heroicons-tag-20-solid', label: 'No sales.' }"
      :rows="rows"
      :columns="columns"
      :loading="isPendingSales"
    >
      <template #status-data="{ row }">
        <StatusBadge
          :color="row.statusTone"
          :label="row.statusLabel"
        />
      </template>

      <template #actions-data="{ row }">
        <div class="flex items-center justify-end">
          <UDropdown
            v-if="row.stoppable"
            :items="rowActions(row)"
          >
            <UButton
              color="gray"
              variant="ghost"
              :icon="ICON_NAME_BY_ALIAS['moreHorizontal']"
            />
          </UDropdown>
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
