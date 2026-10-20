<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract'

const props = defineProps<{
  payouts: ShopFinancePayout[]
}>()

const statusByValue = {
  pending: { label: 'Pending', color: 'yellow' },
  paid: { label: 'Paid', color: 'green' },
  blocked: { label: 'Blocked', color: 'gray' },
  failed: { label: 'Failed', color: 'red' },
} as const satisfies Record<ShopFinancePayout['state'], {
  label: string
  color: 'yellow' | 'green' | 'gray' | 'red'
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
]

function formatPayoutDate(payout: ShopFinancePayout) {
  return dateFormatter.format(new Date(payout.paid_at ?? payout.created_at))
}

const rows = computed(() => props.payouts.map(payout => ({
  id: payout.id,
  amount: formatMinorCurrency(payout.amount_minor, payout.currency),
  currency: payout.currency,
  date: formatPayoutDate(payout),
  stateLabel: statusByValue[payout.state].label,
  stateTone: statusByValue[payout.state].color,
})))
</script>

<template>
  <div class="rounded-lg border border-border-subtle bg-surface p-5">
    <div class="flex items-center gap-2">
      <AppIcon
        name="payment"
        size="xs"
        class="text-text-subtle"
      />
      <span class="text-sm font-medium text-text-muted">Payout history</span>
    </div>

    <DataTable
      class="mt-4"
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="{ icon: ICON_NAME_BY_ALIAS.payment, label: 'No payouts yet' }"
    >
      <template #state-data="{ row }">
        <StatusBadge
          :label="row.stateLabel"
          :color="row.stateTone"
        />
      </template>
    </DataTable>
  </div>
</template>
