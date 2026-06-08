<script lang="ts" setup>
import { fromMinorUnits, toCurrencyOption } from '@arc/utils'
import type { ShopOrder } from '~/app/pages/orders/[id]/_components/order-detail-content/types'

const props = defineProps<{
  order: ShopOrder
}>()

function formatAmountWithShortLabel(amountMinor: number) {
  const amount = fromMinorUnits(amountMinor, props.order.currency)
  const currency = toCurrencyOption(props.order.currency).shortLabel

  return `${amount.toFixed(2)} ${currency}`
}
</script>

<template>
  <div>
    <div class="font-semibold">
      Summary order
    </div>

    <div class="mt-4 space-y-3 text-sm">
      <div class="flex items-center justify-between gap-4">
        <div class="text-text-muted">
          Subtotal:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(order.subtotal_minor) }}
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="text-text-muted">
          Discount:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(order.discount_minor) }}
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="text-text-muted">
          Shipping cost:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(order.shipping_minor) }}
        </div>
      </div>

      <div class="border-t border-border-subtle" />

      <div class="flex items-center justify-between gap-4 text-lg font-semibold text-text-strong">
        <div>Total</div>
        <div>{{ formatAmountWithShortLabel(order.total_minor) }}</div>
      </div>
    </div>
  </div>
</template>
