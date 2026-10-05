<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract'

/**
 * Per-shop money in the checkout review, mirroring the cart's per-shop summary:
 * the merchandise total, any code saving applied to it, and the resulting shop
 * total. The basket-level Summary Order card carries the checkout breakdown.
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
