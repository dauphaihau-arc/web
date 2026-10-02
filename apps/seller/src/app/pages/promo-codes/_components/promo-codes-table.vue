<script setup lang="ts">
import { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import FixedPagination from '~/shared/ui/fixed-pagination.vue'
import { useShopGetPromoCodes } from '~/domains/shop/queries/promo-codes.query'
import type { ShopPromoCode } from '~/domains/shop/api/promo-code/contracts/promo-code.contract'
import { formatScheduleRange } from '~/domains/shop/utils/format-schedule-range'

type PromoCodeRow = ShopPromoCode & {
  benefit: string
  scope: string
  schedule: string
  statusLabel: string
  statusTone: PromotionStatusTone
}

const pageCount = 10
const page = ref(1)

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
}))

const {
  isPending: isPendingPromoCodes,
  data: promoCodesData,
  refetch: refetchPromoCodes,
} = useShopGetPromoCodes(params)

const statusLabels: Record<PromotionStatus, string> = {
  [PromotionStatus.SCHEDULED]: 'Scheduled',
  [PromotionStatus.ACTIVE]: 'Active',
  [PromotionStatus.ENDED]: 'Ended',
  [PromotionStatus.CANCELLED]: 'Cancelled',
}

type PromotionStatusTone = 'blue' | 'green' | 'gray' | 'red'

const statusTones: Record<PromotionStatus, PromotionStatusTone> = {
  [PromotionStatus.SCHEDULED]: 'blue',
  [PromotionStatus.ACTIVE]: 'green',
  [PromotionStatus.ENDED]: 'gray',
  [PromotionStatus.CANCELLED]: 'red',
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'benefit', label: 'Benefit', class: 'text-center', rowClass: 'text-center' },
  { key: 'scope', label: 'Scope', class: 'text-center', rowClass: 'text-center' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'status', label: 'Status', class: 'text-center', rowClass: 'text-center' },
]

const rows = computed<PromoCodeRow[]>(() =>
  (promoCodesData.value?.results ?? []).map(promoCode => ({
    ...promoCode,
    benefit: `${promoCode.percent_off}%`,
    scope: promoCode.product_scope === PromotionProductScope.ALL
      ? 'All products'
      : `${promoCode.product_ids.length} ${promoCode.product_ids.length === 1 ? 'product' : 'products'}`,
    schedule: formatScheduleRange(promoCode.start_at, promoCode.end_at, promoCode.timezone),
    statusLabel: statusLabels[promoCode.status] ?? promoCode.status,
    statusTone: statusTones[promoCode.status],
  })),
)

function handlePageChange(nextPage: number) {
  page.value = nextPage
  refetchPromoCodes()
}
</script>

<template>
  <div>
    <DataTable
      :empty-state="{ icon: 'i-heroicons-ticket-20-solid', label: 'No promo codes.' }"
      :rows="rows"
      :columns="columns"
      :loading="isPendingPromoCodes"
    >
      <template #status-data="{ row }">
        <StatusBadge
          :label="row.statusLabel"
          :tone="row.statusTone"
        />
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
      :total="promoCodesData?.total_results ?? 0"
      @on-change-page="handlePageChange"
    />
  </div>
</template>
