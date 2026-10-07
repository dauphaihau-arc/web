<script setup lang="ts">
import { formatMinorCurrency, formatShippingEstimateRange } from '@arc/utils'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract'

/**
 * Per-shop money in the checkout review: the merchandise total, any code saving
 * applied to it, the accepted Shipping Charge, and the resulting shop total. The
 * accepted quote's shipping money is already net of any free-shipping waiver, so
 * the rows reconcile: merchandise - code saving + shipping = total. Before a
 * quote exists the cart is merchandise-only, so the charge has nothing to show.
 * The basket-level Summary Order card carries the same breakdown for the basket.
 */
const props = withDefaults(defineProps<{
  shopCart: CartShopGroup
  /**
   * Server-computed shop quote accepted at review. When present its accepted
   * money replaces the cart's merchandise-only figures.
   */
  quoteShop?: CheckoutQuoteShop
  /**
   * Checkout currency the server accepted for this basket. Every per-shop
   * amount is already denominated in it, so the review never formats accepted
   * money with a seller's shipping source currency.
   */
  checkoutCurrency?: string
}>(), {
  quoteShop: undefined,
  checkoutCurrency: undefined,
})

const displayCurrency = computed(
  () => props.checkoutCurrency
    ?? props.quoteShop?.shipping?.currency
    ?? props.shopCart.currency,
)

const merchandiseTotalMinor = computed(
  () => props.quoteShop?.subtotal_minor ?? props.shopCart.total_minor,
)

const codeSavingsMinor = computed(
  () => props.quoteShop?.discount_minor ?? props.shopCart.discount_minor,
)

/**
 * Accepted Shipping Charge for this shop. Present only once the server has
 * priced the shop, so the row stays hidden while the cart is merchandise-only.
 * The amount is net of the free-shipping waiver below.
 */
const shippingMinor = computed(() => props.quoteShop?.shipping_minor)

/** Waived amount, carried for provenance; already deducted from `shippingMinor`. */
const shippingDiscountMinor = computed(
  () => props.quoteShop?.shipping_discount_minor ?? 0,
)

/**
 * Seller's accepted Processing/Delivery window for this shop, printed from the
 * quote snapshot. Empty until the server has priced the shop.
 */
const estimateLabel = computed(
  () => formatShippingEstimateRange(props.quoteShop?.shipping?.estimate),
)

/**
 * Accepted quote total when the server has priced this shop, the cart's own
 * merchandise total net of its code saving before that. The cart is
 * merchandise-only, so it never implies a charge the server has not accepted.
 */
const totalMinor = computed(
  () => props.quoteShop?.total_minor
    ?? (props.shopCart.total_minor - props.shopCart.discount_minor),
)
</script>

<template>
  <div>
    <template v-if="codeSavingsMinor > 0">
      <div class="flex justify-between">
        <div class="title">
          <div>Product(s) total</div>
          <div>Code savings</div>
        </div>
        <div class="price">
          <div>
            {{ formatMinorCurrency(merchandiseTotalMinor, displayCurrency) }}
          </div>
          <div>
            {{ formatMinorCurrency(codeSavingsMinor, displayCurrency) }}
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
          {{ formatMinorCurrency(shippingMinor, displayCurrency) }}
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
    <UDivider
      v-if="typeof shippingMinor === 'number'"
      class="my-3"
    />
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
