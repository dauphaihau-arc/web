<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { CartSummary } from '~/domains/cart/api/cart.shared'
import type { CheckoutQuoteResponse } from '~/domains/me/api/order/contracts/order.contract'

/**
 * The basket-level mirror of the per-shop summaries: the merchandise breakdown
 * appears only when the basket carries code savings, otherwise only the total
 * does. An accepted quote replaces the cart's merchandise-only figures with the
 * money the server accepted. The accepted shipping money is already net of any
 * free-shipping waiver, so the rows reconcile:
 * merchandise - code saving + shipping = total.
 */
const props = withDefaults(defineProps<{
  loading: boolean
  summaryOrder?: CartSummary
  /**
   * Server-computed checkout quote. When present it is the accepted money the
   * buyer reviews; the cart summary is merchandise-only until then.
   */
  quote?: CheckoutQuoteResponse
}>(), {
  summaryOrder: undefined,
  quote: undefined,
})

const currency = computed(() => props.quote?.checkout_currency ?? props.summaryOrder?.currency ?? '')
const merchandiseSubtotalMinor = computed(
  () => props.quote?.subtotal_minor ?? props.summaryOrder?.subtotal_minor ?? 0,
)
const discountMinor = computed(() => props.quote?.discount_minor ?? props.summaryOrder?.discount_minor ?? 0)
const totalMinor = computed(() => props.quote?.total_minor ?? props.summaryOrder?.total_minor ?? 0)

/**
 * Accepted basket Shipping Charge (the sum of the per-shop charges). Present
 * only once the server has quoted the basket, so the row stays hidden while the
 * cart is merchandise-only. The amount is net of the waiver below.
 */
const shippingMinor = computed(() => props.quote?.shipping_minor)

/**
 * Waived basket amount, carried for provenance; already deducted from
 * `shippingMinor`. The basket response carries no aggregate, so the accepted
 * per-shop provenance is summed.
 */
const shippingDiscountMinor = computed(
  () => props.quote?.shops.reduce(
    (sum, shop) => sum + (shop.shipping_discount_minor ?? 0),
    0,
  ) ?? 0,
)

const selectedQuantity = computed(() => props.summaryOrder?.total_selected_quantity ?? 0)
</script>

<template>
  <UCard v-if="props.summaryOrder">
    <div class="space-y-7">
      <legend class="mb-1 text-xl font-bold text-text-subtle">
        Summary Order
      </legend>
      <div
        v-if="props.loading"
        class="grid h-48 place-content-center"
      >
        <LoadingSvg :child-class="'!w-9 !h-9'" />
      </div>
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <template v-if="discountMinor > 0">
          <div class="flex justify-between">
            <div class="title">
              <div>Product(s) total</div>
              <div>Code savings</div>
            </div>
            <div class="price">
              <div>
                {{ formatMinorCurrency(merchandiseSubtotalMinor, currency) }}
              </div>
              <div class="text-right">
                {{ formatMinorCurrency(discountMinor, currency) }}
              </div>
            </div>
          </div>
          <UDivider class="my-3" />
        </template>
        <div
          v-if="typeof shippingMinor === 'number'"
          class="flex justify-between"
        >
          <div class="title">
            <div>Shipping</div>
            <div v-if="shippingDiscountMinor > 0">
              Shipping savings
            </div>
          </div>
          <div class="price">
            <div>
              {{ formatMinorCurrency(shippingMinor, currency) }}
            </div>
            <div v-if="shippingDiscountMinor > 0">
              {{ formatMinorCurrency(shippingDiscountMinor, currency) }}
            </div>
          </div>
        </div>
        <UDivider
          v-if="typeof shippingMinor === 'number'"
          class="my-3"
        />
        <div class="flex justify-between gap-3">
          <div class="text-lg font-medium">
            Total ({{ selectedQuantity }} {{ selectedQuantity > 1 ? 'products' : 'product' }})
          </div>
          <div :class="['price', totalMinor > 0 && 'text-text-strong']">
            {{ formatMinorCurrency(totalMinor, currency) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped lang="postcss">
.title {
  @apply text-lg font-normal text-text-strong
}

.price {
  @apply text-right text-lg font-medium
}
</style>
