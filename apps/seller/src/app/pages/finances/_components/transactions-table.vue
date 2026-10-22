<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type {
  ShopFinanceTransaction,
  ShopFinanceTransactionStatus,
  ShopFinanceTransactionType,
} from '~/domains/shop/api/finance/contracts/transactions.contract'

const props = withDefaults(defineProps<{
  transactions: ShopFinanceTransaction[]
  loading?: boolean
  emptyLabel?: string
}>(), {
  loading: false,
  emptyLabel: 'No transactions yet',
})

const typeLabelByValue = {
  order_income: 'Order income',
  refund: 'Refund',
  payout: 'Payout',
} as const satisfies Record<ShopFinanceTransactionType, string>

const statusByValue = {
  released: { label: 'Released', color: 'green' },
  pending: { label: 'Pending', color: 'yellow' },
  deducted: { label: 'Deducted', color: 'blue' },
  paid: { label: 'Paid', color: 'green' },
  blocked: { label: 'Blocked', color: 'gray' },
  failed: { label: 'Failed', color: 'red' },
} as const satisfies Record<ShopFinanceTransactionStatus, {
  label: string
  color: 'green' | 'yellow' | 'blue' | 'gray' | 'red'
}>

const currentYear = new Date().getUTCFullYear()

const dateFormatterWithoutYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const dateFormatterWithYear = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

/** Dates in the current UTC year omit it: "Oct 19" vs "Oct 19, 2025". */
function formatTransactionDate(value: string) {
  const date = new Date(value)

  return date.getUTCFullYear() === currentYear
    ? dateFormatterWithoutYear.format(date)
    : dateFormatterWithYear.format(date)
}

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'documentNumber', label: 'Reference' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'orderAmount', label: 'Order amount' },
  { key: 'fees', label: 'Fees' },
  { key: 'netAmount', label: 'Net amount' },
]

const toneClass = {
  /** Plain money, neither a gain nor a loss: Order income and Payouts. */
  neutral: 'text-text-strong',
  /** Empty cells and de-emphasized pending rows. */
  muted: 'text-text-muted',
  /** Money the seller gained. */
  positive: 'text-state-success-text',
  /** Money the seller lost: Refunds, and the fee taken from Order income. */
  negative: 'text-state-danger-text',
} as const

type MoneyCell = { label: string, tone: string }

const emptyCell: MoneyCell = { label: '—', tone: toneClass.muted }

/**
 * Amounts arrive signed from the API. Format the magnitude and render the sign
 * explicitly so income and deductions are distinguishable at a glance.
 */
function formatSignedAmount(value: number, currency: string) {
  const magnitude = formatMinorCurrency(Math.abs(value), currency)
  return value === 0
    ? magnitude
    : `${value < 0 ? '-' : '+'}${magnitude}`
}

/** Income is plain, a Refund's negative amount is a loss. */
function orderAmountCell(transaction: ShopFinanceTransaction): MoneyCell {
  const amount = transaction.order_amount_minor

  if (amount === null) {
    return emptyCell
  }

  return {
    label: formatSignedAmount(amount, transaction.currency),
    tone: amount < 0 ? toneClass.negative : toneClass.neutral,
  }
}

/** The fee taken on income is a loss; a Refund's positive fee rebate is a gain. */
function feesCell(transaction: ShopFinanceTransaction): MoneyCell {
  const amount = transaction.fees_minor

  if (amount === null) {
    return emptyCell
  }

  return {
    label: formatSignedAmount(amount, transaction.currency),
    tone: amount > 0
      ? toneClass.positive
      : amount < 0
        ? toneClass.negative
        : toneClass.neutral,
  }
}

/**
 * A Payout is the seller's own money leaving the balance, not a loss, so its
 * negative net stays neutral. Only income/refund nets are signed gains/losses.
 */
function netAmountCell(transaction: ShopFinanceTransaction): MoneyCell {
  const amount = transaction.net_amount_minor

  return {
    label: formatSignedAmount(amount, transaction.currency),
    tone: transaction.type === 'payout'
      ? toneClass.neutral
      : amount > 0
        ? toneClass.positive
        : amount < 0
          ? toneClass.negative
          : toneClass.neutral,
  }
}

/**
 * Payout rows show the Payout reference (`PAY-YYYYMMDD-NNNNNN`); income and
 * refund rows show the seller-facing Order number instead of the Order id.
 */
function formatDocumentNumber(transaction: ShopFinanceTransaction) {
  if (transaction.type === 'payout') {
    return transaction.reference
  }

  return transaction.order_number ?? '—'
}

const rows = computed(() => props.transactions.map((transaction, index) => {
  const orderAmount = orderAmountCell(transaction)
  const fees = feesCell(transaction)
  const netAmount = netAmountCell(transaction)

  // DataTable has no row-level class hook, so a pending row is de-emphasized
  // through its money cells: no gain/loss color until the row settles.
  const pending = transaction.status === 'pending'
  const tone = (cell: MoneyCell) => (pending ? toneClass.muted : cell.tone)

  return {
    id: transaction.id ?? `${transaction.type}:${transaction.reference}:${transaction.date}:${index}`,
    date: formatTransactionDate(transaction.date),
    documentNumber: formatDocumentNumber(transaction),
    typeLabel: typeLabelByValue[transaction.type],
    statusLabel: statusByValue[transaction.status].label,
    statusTone: statusByValue[transaction.status].color,
    orderAmount: orderAmount.label,
    orderAmountTone: tone(orderAmount),
    fees: fees.label,
    feesTone: tone(fees),
    netAmount: netAmount.label,
    netAmountTone: tone(netAmount),
  }
}))
</script>

<template>
  <DataTable
    :rows="rows"
    :columns="columns"
    :selectable="false"
    :loading="loading"
    :empty-state="{ icon: ICON_NAME_BY_ALIAS.receiptText, label: emptyLabel }"
  >
    <template #type-data="{ row }">
      <span class="text-text-strong">{{ row.typeLabel }}</span>
    </template>
    <template #status-data="{ row }">
      <StatusBadge
        :label="row.statusLabel"
        :color="row.statusTone"
      />
    </template>
    <template #orderAmount-data="{ row }">
      <span
        class="tabular-nums"
        :class="row.orderAmountTone"
      >
        {{ row.orderAmount }}
      </span>
    </template>
    <template #fees-data="{ row }">
      <span
        class="tabular-nums"
        :class="row.feesTone"
      >
        {{ row.fees }}
      </span>
    </template>
    <template #netAmount-data="{ row }">
      <span
        class="tabular-nums"
        :class="row.netAmountTone"
      >
        {{ row.netAmount }}
      </span>
    </template>
    <template #documentNumber-data="{ row }">
      <span class="font-mono text-xs text-text-muted">{{ row.documentNumber }}</span>
    </template>
  </DataTable>
</template>
