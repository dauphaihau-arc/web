<script setup lang="ts">
import type { AdminShopPayout } from '~/domains/finance/api/contracts/admin-finance.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { useAdminShopPayouts } from '~/domains/finance/queries/payouts.query'
import {
  formatFinanceAmount,
  payoutStateLabel,
  payoutStateTone,
} from '~/domains/finance/utils/finance-presentation'
import {
  formatFinanceDateTime,
  payoutReasonLabel,
  payoutSourceMeta,
} from './finance-presentation'

const props = defineProps<{
  shopId: string
}>()

const {
  data: payouts,
  isPending,
  isError,
  refetch,
} = useAdminShopPayouts(() => props.shopId)

const columns = [
  { key: 'number', label: 'Payout' },
  { key: 'amount', label: 'Amount' },
  { key: 'state', label: 'State' },
  { key: 'source', label: 'Source' },
  { key: 'period', label: 'Period' },
  { key: 'created', label: 'Created' },
  { key: 'paid', label: 'Paid' },
  { key: 'reason', label: 'Reason' },
]

/**
 * A Payout converted into the account currency shows both sides: what left the
 * shop balance and what the provider reported landing.
 */
function targetAmount(payout: AdminShopPayout) {
  if (
    !payout.target_currency
    || payout.target_currency === payout.currency
    || payout.target_amount_minor === null
  ) {
    return null
  }

  return `${formatFinanceAmount(payout.target_amount_minor, payout.target_currency)} ${payout.target_currency}`
}

const rows = computed(() => (payouts.value ?? []).map((payout) => {
  const source = payoutSourceMeta[payout.source] ?? { label: payout.source, tone: 'gray' as const }

  return {
    id: payout.id,
    number: payout.payout_number,
    amount: formatFinanceAmount(payout.amount_minor, payout.currency),
    targetAmount: targetAmount(payout),
    stateLabel: payoutStateLabel(payout.state),
    stateTone: payoutStateTone(payout.state),
    sourceLabel: source.label,
    sourceTone: source.tone,
    period: payout.period ?? '—',
    created: formatFinanceDateTime(payout.created_at),
    paid: formatFinanceDateTime(payout.paid_at),
    reason: payoutReasonLabel(payout.reason) ?? '—',
  }
}))
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Payout history
    </div>
    <p class="mt-1 text-sm text-text-subtle">
      Newest first, including blocked payouts.
    </p>

    <div
      v-if="isPending"
      class="mt-4 space-y-3"
    >
      <USkeleton class="h-5 w-full" />
      <USkeleton class="h-5 w-full" />
      <USkeleton class="h-5 w-3/4" />
    </div>

    <Empty
      v-else-if="isError || !payouts"
      class="mt-4"
      variant="subtle"
      :icon="ICON_NAME_BY_ALIAS.warning"
      title="Unable to load payout history"
      description="Something went wrong while loading this shop's payouts."
    >
      <template #actions>
        <UButton
          color="gray"
          size="sm"
          @click="refetch()"
        >
          Try again
        </UButton>
      </template>
    </Empty>

    <div
      v-else
      class="mt-4"
    >
      <DataTable
        :rows="rows"
        :columns="columns"
        :selectable="false"
        :empty-state="{ icon: ICON_NAME_BY_ALIAS.payment, label: 'No payouts yet' }"
      >
        <template #number-data="{ row }">
          <span class="whitespace-nowrap font-medium text-text-strong">{{ row.number }}</span>
        </template>
        <template #amount-data="{ row }">
          <div class="flex flex-col gap-0.5 whitespace-nowrap">
            <span>{{ row.amount }}</span>
            <span
              v-if="row.targetAmount"
              class="text-xs text-text-subtle"
            >
              {{ row.targetAmount }}
            </span>
          </div>
        </template>
        <template #state-data="{ row }">
          <StatusBadge
            :label="String(row.stateLabel)"
            :color="row.stateTone"
          />
        </template>
        <template #source-data="{ row }">
          <StatusBadge
            :label="String(row.sourceLabel)"
            :color="row.sourceTone"
          />
        </template>
        <template #created-data="{ row }">
          <span class="whitespace-nowrap">{{ row.created }}</span>
        </template>
        <template #paid-data="{ row }">
          <span class="whitespace-nowrap">{{ row.paid }}</span>
        </template>
      </DataTable>
    </div>
  </UCard>
</template>
