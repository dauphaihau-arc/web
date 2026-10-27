<script setup lang="ts">
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import { useAdminOrderFinancialBreakdown } from '~/domains/orders/queries/financial-breakdown.query'
import { formatOrderAmount } from '~/domains/orders/utils/order-presentation'

const props = defineProps<{
  order: AdminOrderDetailOrder
}>()

const { data: currentUser } = useGetCurrentUser()

const currentRoles = computed(() => currentUser.value?.user?.roles ?? [])

/**
 * Buyer and seller settlement rows are part of the order an operator is
 * already looking at; the platform-wide revenue and cost rows are not, so only
 * that section is restricted to the roles that settle platform money.
 */
const canViewPlatformRevenue = computed(
  () => currentRoles.value.includes('super_admin') || currentRoles.value.includes('finance'),
)

const breakdownQuery = useAdminOrderFinancialBreakdown(() => props.order.id)

/**
 * `null` means the order has no journal basis yet; it must never be read as a
 * zero commission, so callers render "Not recorded" instead of an amount.
 */
const commissionMinor = computed(() => {
  const value = breakdownQuery.data.value?.platform_commission_minor

  return typeof value === 'number' ? value : null
})

const isCommissionPending = computed(() => breakdownQuery.isPending.value)

type BreakdownRow = {
  id: string
  label: string
  value: string
  /** A truthful absence ("Not recorded" / "Pending reconciliation"). */
  muted?: boolean
  /** A section total: bold on a shaded row. */
  emphasis?: boolean
}

function amount(amountMinor: number) {
  return formatOrderAmount(amountMinor, props.order.currency)
}

function deduction(amountMinor: number) {
  return `−${amount(Math.abs(amountMinor))}`
}

function addition(amountMinor: number) {
  return `+${amount(Math.abs(amountMinor))}`
}

const NOT_RECORDED = 'Not recorded'
const PENDING_RECONCILIATION = 'Pending reconciliation'

const sellerItemTotalMinor = computed(
  () => props.order.subtotal_minor - props.order.sale_discount_minor,
)

function commissionAmount(formatter: (minor: number) => string) {
  if (isCommissionPending.value) {
    return 'Loading…'
  }

  const commission = commissionMinor.value

  return commission === null ? NOT_RECORDED : formatter(commission)
}

function netPayoutMinor() {
  const commission = commissionMinor.value

  return commission === null ? null : props.order.total_minor - commission
}

function payoutDisplay(payoutMinor: number | null) {
  if (isCommissionPending.value) {
    return 'Loading…'
  }

  return payoutMinor === null ? NOT_RECORDED : amount(payoutMinor)
}

const sections = computed<Array<{ id: string, title: string, rows: BreakdownRow[] }>>(() => {
  const shippingDiscountMinor = props.order.shipping_discount_minor ?? 0
  const payoutMinor = netPayoutMinor()

  const buyerRows: BreakdownRow[] = [
    {
      id: 'item-subtotal',
      label: 'Item subtotal',
      value: amount(props.order.subtotal_minor),
    },
  ]

  if (props.order.sale_discount_minor > 0) {
    buyerRows.push({
      id: 'sale-savings',
      label: 'Sale savings',
      value: deduction(props.order.sale_discount_minor),
    })
  }

  if (props.order.discount_minor > 0) {
    buyerRows.push({
      id: 'promo-discount',
      label: 'Promo code discount',
      value: deduction(props.order.discount_minor),
    })
  }

  buyerRows.push({
    id: 'shipping-charged',
    label: 'Shipping charged',
    value: amount(props.order.shipping_minor),
  })

  if (shippingDiscountMinor > 0) {
    buyerRows.push({
      id: 'shipping-savings',
      label: 'Shipping savings',
      value: deduction(shippingDiscountMinor),
    })
  }

  buyerRows.push({
    id: 'order-total',
    label: 'Order total',
    value: amount(props.order.total_minor),
    emphasis: true,
  })

  const sellerRows: BreakdownRow[] = [
    {
      id: 'seller-item-total',
      label: 'Item total after seller discount',
      value: amount(sellerItemTotalMinor.value),
    },
    {
      id: 'commission',
      label: 'Commission',
      value: commissionAmount(deduction),
      muted: !isCommissionPending.value && commissionMinor.value === null,
    },
    {
      id: 'transaction-fee',
      label: 'Transaction fee',
      value: NOT_RECORDED,
      muted: true,
    },
    {
      id: 'adjustments',
      label: 'Adjustments / penalties',
      value: NOT_RECORDED,
      muted: true,
    },
    {
      id: 'net-payout',
      label: 'Net payout to seller',
      value: payoutDisplay(payoutMinor),
      muted: !isCommissionPending.value && payoutMinor === null,
      emphasis: true,
    },
  ]

  const platformRows: BreakdownRow[] = [
    {
      id: 'commission-revenue',
      label: 'Commission revenue',
      value: commissionAmount(addition),
      muted: !isCommissionPending.value && commissionMinor.value === null,
    },
    {
      id: 'transaction-fee-revenue',
      label: 'Transaction fee revenue',
      value: NOT_RECORDED,
      muted: true,
    },
    {
      id: 'platform-funded-discount',
      label: 'Platform-funded discount',
      value: NOT_RECORDED,
      muted: true,
    },
    {
      id: 'payment-gateway-cost',
      label: 'Payment gateway cost',
      value: PENDING_RECONCILIATION,
      muted: true,
    },
    {
      id: 'logistics-subsidy',
      label: 'Logistics / shipping subsidy',
      value: PENDING_RECONCILIATION,
      muted: true,
    },
    {
      id: 'net-platform-margin',
      label: 'Net platform margin',
      value: NOT_RECORDED,
      muted: true,
      emphasis: true,
    },
  ]

  const result = [
    { id: 'buyer', title: 'Buyer paid (this order)', rows: buyerRows },
    { id: 'seller', title: 'Seller settlement', rows: sellerRows },
  ]

  if (canViewPlatformRevenue.value) {
    result.push({ id: 'platform', title: 'Platform revenue & cost', rows: platformRows })
  }

  return result
})
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Pricing &amp; financial breakdown
    </div>

    <div class="mt-5 space-y-6">
      <section
        v-for="(section, index) in sections"
        :key="section.id"
      >
        <h3 class="text-sm font-semibold text-text-strong">
          {{ index + 1 }}. {{ section.title }}
        </h3>

        <div class="mt-1 divide-y divide-border-subtle text-sm">
          <div
            v-for="row in section.rows"
            :key="row.id"
            class="flex items-center justify-between gap-4 px-0.5 py-2.5"
            :class="row.emphasis
              ? 'bg-surface-muted font-semibold text-text-strong'
              : ''"
          >
            <span
              :class="row.emphasis ? 'font-semibold text-text-strong' : 'text-text-muted'"
            >
              {{ row.label }}
            </span>
            <span
              :class="[
                row.muted ? 'text-text-muted' : 'text-text-strong',
                row.emphasis ? 'font-semibold' : '',
              ]"
            >
              {{ row.value }}
            </span>
          </div>
        </div>
      </section>
    </div>
  </UCard>
</template>
