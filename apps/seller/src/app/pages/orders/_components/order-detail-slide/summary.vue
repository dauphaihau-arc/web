<script lang="ts" setup>
import { formatMinorCurrency, formatShippingEstimateRange } from '@arc/utils'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
}>()

function formatAmountWithShortLabel(amountMinor: number) {
  return formatMinorCurrency(amountMinor, props.order.currency)
}

const estimateLabel = computed(
  () => formatShippingEstimateRange(props.order.shipping?.estimate),
)
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
          Shipping charge:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(order.shipping_minor) }}
        </div>
      </div>

      <div
        v-if="estimateLabel"
        class="flex items-center justify-between gap-4"
      >
        <div class="text-text-muted">
          Estimated delivery:
        </div>
        <div class="text-text-strong">
          {{ estimateLabel }}
        </div>
      </div>

      <div
        v-if="estimateLabel"
        class="text-right text-xs text-text-muted"
      >
        Seller estimate, not a carrier guarantee.
      </div>

      <div class="border-t border-border-subtle" />

      <div class="flex items-center justify-between gap-4 text-lg font-semibold text-text-strong">
        <div>Total</div>
        <div>{{ formatAmountWithShortLabel(order.total_minor) }}</div>
      </div>
    </div>
  </div>
</template>
