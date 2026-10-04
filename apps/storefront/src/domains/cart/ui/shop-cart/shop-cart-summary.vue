<script setup lang="ts">
import { formatMinorCurrency, formatShippingEstimateRange } from '@arc/utils'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract'

const props = withDefaults(defineProps<{
  shopCart: CartShopGroup
  /**
   * Server-computed shop quote accepted at review. It carries the seller's
   * Shipping Charge and Processing/Delivery estimate; the browser never
   * calculates either.
   */
  quoteShop?: CheckoutQuoteShop
  /**
   * Checkout currency the server accepted for this basket. Every per-shop
   * amount is already denominated in it, so the review never formats accepted
   * money with a seller's shipping source currency.
   */
  checkoutCurrency?: string
  isPending?: boolean
}>(), {
  quoteShop: undefined,
  checkoutCurrency: undefined,
  isPending: false,
})

const displayCurrency = computed(
  () => props.checkoutCurrency
    ?? props.quoteShop?.shipping?.currency
    ?? props.shopCart.currency,
)

/**
 * Accepted quote money when the server has priced this shop, the cart's own
 * merchandise total before that. The cart is merchandise-only, so it never
 * implies a charge the server has not accepted.
 */
const merchandiseSubtotalMinor = computed(
  () => props.quoteShop
    ? props.quoteShop.subtotal_minor + (props.quoteShop.sale_discount_minor ?? 0)
    : props.shopCart.total_minor,
)

const saleDiscountMinor = computed(
  () => props.quoteShop?.sale_discount_minor ?? 0,
)

const discountMinor = computed(
  () => props.quoteShop?.discount_minor ?? props.shopCart.discount_minor,
)

const subtotalAfterDiscountMinor = computed(
  () => merchandiseSubtotalMinor.value - saleDiscountMinor.value - discountMinor.value,
)

const shippingDiscountMinor = computed(() => props.quoteShop?.shipping_discount_minor ?? 0)

const shippingMinor = computed(
  () => (props.isPending ? undefined : props.quoteShop?.shipping_minor),
)

const totalMinor = computed(
  () => props.quoteShop?.total_minor ?? subtotalAfterDiscountMinor.value,
)

const estimateLabel = computed(() => formatShippingEstimateRange(props.quoteShop?.shipping?.estimate))
</script>

<template>
  <div>
    <div class="flex justify-between">
      <div class="title">
        <div>Product(s) total</div>
        <div v-if="saleDiscountMinor > 0">
          Sale savings
        </div>
        <div>Code savings</div>
      </div>
      <div class="price">
        <div>
          {{ formatMinorCurrency(merchandiseSubtotalMinor, displayCurrency) }}
        </div>
        <div v-if="saleDiscountMinor > 0">
          {{ formatMinorCurrency(saleDiscountMinor, displayCurrency) }}
        </div>
        <div>
          {{ formatMinorCurrency(discountMinor, displayCurrency) }}
        </div>
      </div>
    </div>
    <UDivider class="my-3" />
    <div class="flex justify-between">
      <div class="title">
        <div>Subtotal</div>
        <div>Shipping</div>
        <div v-if="shippingDiscountMinor > 0">
          Shipping savings
        </div>
      </div>
      <div class="price">
        <div>
          {{ formatMinorCurrency(subtotalAfterDiscountMinor, displayCurrency) }}
        </div>
        <div
          v-if="isPending"
          class="text-text-muted"
        >
          Calculating...
        </div>
        <div
          v-else-if="typeof shippingMinor === 'number'"
          class="text-right"
        >
          {{ formatMinorCurrency(shippingMinor, displayCurrency) }}
        </div>
        <div
          v-else
          class="text-text-muted"
        >
          Calculated at checkout
        </div>
        <div v-if="shippingDiscountMinor > 0">
          {{ formatMinorCurrency(shippingDiscountMinor, displayCurrency) }}
        </div>
      </div>
    </div>
    <div
      v-if="estimateLabel"
      class="mt-1 text-sm text-text-muted"
    >
      Estimated delivery: {{ estimateLabel }}
    </div>
    <UDivider class="my-3" />
    <div class="flex justify-between">
      <div class="font-semibold">
        Total
      </div>
      <div class="font-semibold">
        {{ formatMinorCurrency(totalMinor, displayCurrency) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.title {
  @apply font-normal
}

.price {
  @apply text-right
}
</style>
