<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type { DropdownItem } from '#ui/types'
import FixedPagination from '~/shared/ui/fixed-pagination.vue'
import ScheduleCell from '~/shared/ui/schedule-cell.vue'
import SelectionActionBar from '~/shared/ui/selection-action-bar.vue'
import { useShopGetPromoCodes } from '~/domains/shop/queries/promo-codes.query'
import type { ShopPromoCode } from '~/domains/shop/api/promo-code/contracts/promo-code.contract'
import { formatScheduleDateRange, formatScheduleDateTime } from '~/domains/shop/utils/format-schedule-range'
import StopPromoCodeDialog from './stop-promo-code-dialog.vue'
import BulkStopPromoCodesDialog from './bulk-stop-promo-codes-dialog.vue'
import {
  formatPromoAllowance,
  formatPromoBenefit,
  promoCodeStatusLabels,
  promoCodeStatusTones,
  type PromotionStatusTone,
} from './promo-codes-table.helpers'

type PromoCodeRow = ShopPromoCode & {
  benefit: string
  scope: string
  allowance: string
  schedule: string
  scheduleStart: string
  scheduleEnd: string
  statusLabel: string
  statusTone: PromotionStatusTone
  /** Whether this Promo Code still has an action to offer. */
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
  isPending: isPendingPromoCodes,
  data: promoCodesData,
  refetch: refetchPromoCodes,
} = useShopGetPromoCodes(params)

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'benefit', label: 'Benefit', class: 'text-center', rowClass: 'text-center' },
  { key: 'scope', label: 'Scope', class: 'text-center', rowClass: 'text-center' },
  { key: 'allowance', label: 'Redemptions', class: 'text-center', rowClass: 'text-center' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'status', label: 'Status', class: 'text-center', rowClass: 'text-center' },
  { key: 'actions' },
]

/**
 * Only a scheduled Promo Code can be cancelled and only an active one can be
 * ended. Ended and cancelled Promo Codes have reached a final state: they keep
 * their definition and history but offer no further action.
 */
function isStoppable(status: PromotionStatus): boolean {
  return status === PromotionStatus.SCHEDULED || status === PromotionStatus.ACTIVE
}

const rows = computed<PromoCodeRow[]>(() =>
  (promoCodesData.value?.results ?? []).map(promoCode => ({
    ...promoCode,
    benefit: formatPromoBenefit(promoCode),
    scope: promoCode.product_scope === PromotionProductScope.ALL
      ? 'All products'
      : `${promoCode.product_ids.length} ${promoCode.product_ids.length === 1 ? 'product' : 'products'}`,
    allowance: formatPromoAllowance(promoCode),
    schedule: formatScheduleDateRange(promoCode.start_at, promoCode.end_at, promoCode.timezone),
    scheduleStart: formatScheduleDateTime(promoCode.start_at, promoCode.timezone),
    scheduleEnd: formatScheduleDateTime(promoCode.end_at, promoCode.timezone),
    statusLabel: promoCodeStatusLabels[promoCode.status] ?? promoCode.status,
    statusTone: promoCodeStatusTones[promoCode.status],
    stoppable: isStoppable(promoCode.status),
    actions: { class: 'text-right' },
  })),
)

const selected = ref<PromoCodeRow[]>([])

watch(rows, () => {
  selected.value = []
})

/**
 * Only a scheduled Promo Code can be cancelled and only an active one can be
 * ended, so the bulk action sends just those; ended and cancelled Promo Codes
 * keep their final state.
 */
const stoppableSelected = computed(() =>
  selected.value.filter(promoCode => promoCode.stoppable),
)

function openStopPromoCode(row: PromoCodeRow) {
  dialog.open(StopPromoCodeDialog, {
    promoCodeId: row.id,
    action: row.status === PromotionStatus.SCHEDULED ? 'cancel' : 'end',
  })
}

function openBulkStop() {
  dialog.open(BulkStopPromoCodesDialog, {
    ids: stoppableSelected.value.map(promoCode => promoCode.id),
    scheduledCount: stoppableSelected.value.filter(promoCode => promoCode.status === PromotionStatus.SCHEDULED).length,
    activeCount: stoppableSelected.value.filter(promoCode => promoCode.status === PromotionStatus.ACTIVE).length,
  })
}

/**
 * Only ever read for a stoppable row, so the single item is the
 * state-appropriate action: cancel a scheduled Promo Code, end an active one.
 */
function rowActions(row: PromoCodeRow): DropdownItem[][] {
  return [[{
    label: row.status === PromotionStatus.SCHEDULED ? 'Cancel promo code' : 'End promo code',
    icon: ICON_NAME_BY_ALIAS.warning,
    click: () => openStopPromoCode(row),
  }]]
}

function handlePageChange(nextPage: number) {
  page.value = nextPage
  refetchPromoCodes()
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
        End promo code
      </UButton>
    </SelectionActionBar>

    <DataTable
      v-model="selected"
      by="id"
      :empty-state="{ icon: 'i-heroicons-ticket-20-solid', label: 'No promo codes.' }"
      :rows="rows"
      :columns="columns"
      :loading="isPendingPromoCodes"
    >
      <template #allowance-data="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <span v-if="row.allowance">{{ row.allowance }}</span>
          <StatusBadge
            v-if="row.exhausted"
            color="yellow"
            label="Exhausted"
          />
        </div>
      </template>

      <template #schedule-data="{ row }">
        <ScheduleCell
          :schedule="row.schedule"
          :start="row.scheduleStart"
          :end="row.scheduleEnd"
          :timezone="row.timezone"
        />
      </template>

      <template #status-data="{ row }">
        <StatusBadge
          :label="row.statusLabel"
          :color="row.statusTone"
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
      :total="promoCodesData?.total_results ?? 0"
      @on-change-page="handlePageChange"
    />
  </div>
</template>
