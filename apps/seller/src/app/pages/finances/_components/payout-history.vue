<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import Empty from '@arc/ui/primitives/empty.vue'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract'
import { useShopFinancePayouts } from '~/domains/shop/queries/payouts.query'
import type { PayoutFilters } from './payout-filters'
import PayoutsFilterToolbar from './payouts-filter-toolbar.vue'

const { data: response, isPending, isError } = useShopFinancePayouts()

const filters = ref<PayoutFilters>({
  states: [],
  sources: [],
})

const hasFilters = computed(() =>
  filters.value.states.length > 0 || filters.value.sources.length > 0,
)

const statusByValue = {
  pending: { label: 'Pending', color: 'yellow' },
  paid: { label: 'Paid', color: 'green' },
  blocked: { label: 'Blocked', color: 'gray' },
  failed: { label: 'Failed', color: 'red' },
} as const satisfies Record<ShopFinancePayout['state'], {
  label: string
  color: 'yellow' | 'green' | 'gray' | 'red'
}>

const reasonLabels: Record<string, string> = {
  no_payout_account: 'No payout account',
  payout_account_unverified: 'Account not verified',
  payout_account_disabled: 'Account disabled',
  payout_account_currency_mismatch: 'Account currency mismatch',
}

const sourceByValue = {
  scheduled: { label: 'Scheduled', color: 'gray' },
  manual: { label: 'Manual', color: 'blue' },
} as const satisfies Record<ShopFinancePayout['source'], {
  label: string
  color: 'gray' | 'blue'
}>

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

const columns = [
  { key: 'amount', label: 'Amount' },
  { key: 'currency', label: 'Currency' },
  { key: 'date', label: 'Date' },
  { key: 'state', label: 'State', class: 'text-center', rowClass: 'text-center' },
  { key: 'source', label: 'Source', class: 'text-center', rowClass: 'text-center' },
]

function formatPayoutDate(payout: ShopFinancePayout) {
  return dateFormatter.format(new Date(payout.paid_at ?? payout.created_at))
}

const payouts = computed(() => (response.value?.payouts ?? []).filter(payout =>
  (filters.value.states.length === 0 || filters.value.states.includes(payout.state))
  && (filters.value.sources.length === 0 || filters.value.sources.includes(payout.source)),
))

const rows = computed(() => payouts.value.map(payout => ({
  id: payout.id,
  amount: formatMinorCurrency(payout.amount_minor, payout.currency),
  currency: payout.currency,
  date: formatPayoutDate(payout),
  stateLabel: statusByValue[payout.state].label,
  stateTone: statusByValue[payout.state].color,
  sourceLabel: sourceByValue[payout.source].label,
  sourceTone: sourceByValue[payout.source].color,
  reason: payout.reason ? (reasonLabels[payout.reason] ?? payout.reason) : null,
})))

const emptyLabel = computed(() =>
  hasFilters.value ? 'No payouts match these filters' : 'No payouts yet',
)

function handleFilterChange(nextFilters: PayoutFilters) {
  filters.value = nextFilters
}
</script>

<template>
  <div>
    <PayoutsFilterToolbar @change="handleFilterChange" />

    <div
      v-if="isPending"
      class="space-y-3"
    >
      <USkeleton class="h-5 w-32" />
      <USkeleton class="mt-5 h-5 w-48" />
      <USkeleton class="mt-4 h-5 w-48" />
    </div>

    <Empty
      v-else-if="isError || !response"
      title="Unable to load payout history"
      description="Reload the page to try again."
    />

    <DataTable
      v-else
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="{ icon: ICON_NAME_BY_ALIAS.payment, label: emptyLabel }"
    >
      <template #state-data="{ row }">
        <div class="flex flex-col items-center gap-1">
          <StatusBadge
            :label="row.stateLabel"
            :color="row.stateTone"
          />
          <span
            v-if="row.reason"
            class="text-xs text-text-subtle"
          >
            {{ row.reason }}
          </span>
        </div>
      </template>
      <template #source-data="{ row }">
        <StatusBadge
          :label="row.sourceLabel"
          :color="row.sourceTone"
        />
      </template>
    </DataTable>
  </div>
</template>
