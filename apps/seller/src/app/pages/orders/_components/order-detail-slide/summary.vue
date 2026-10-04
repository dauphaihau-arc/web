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

const regularMerchandiseMinor = computed(
  () => props.order.subtotal_minor + props.order.sale_discount_minor,
)

const subtotalAfterDiscountsMinor = computed(
  () => regularMerchandiseMinor.value - props.order.sale_discount_minor - props.order.discount_minor,
)

const shippingDiscountMinor = computed(
  () => props.order.shipping_discount_minor ?? 0,
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
          Product(s) total:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(regularMerchandiseMinor) }}
        </div>
      </div>

      <div
        v-if="order.sale_discount_minor > 0"
        class="flex items-center justify-between gap-4"
      >
        <div class="text-text-muted">
          Sale savings:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(order.sale_discount_minor) }}
        </div>
      </div>

      <div
        v-if="order.discount_minor > 0"
        class="flex items-center justify-between gap-4"
      >
        <div class="text-text-muted">
          Code savings:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(order.discount_minor) }}
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="text-text-muted">
          Subtotal:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(subtotalAfterDiscountsMinor) }}
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
        v-if="shippingDiscountMinor > 0"
        class="flex items-center justify-between gap-4"
      >
        <div class="text-text-muted">
          Shipping savings:
        </div>
        <div class="text-text-strong">
          {{ formatAmountWithShortLabel(shippingDiscountMinor) }}
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
