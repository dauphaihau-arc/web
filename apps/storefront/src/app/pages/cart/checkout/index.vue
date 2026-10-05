<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import CreateOrderBtn from './_components/create-order-btn.vue'
import ReviewShippingAndPayment from '~/domains/checkout/ui/review-shipping-and-payment.vue'
import ShopCart from './_components/shop-cart.vue'
import SummaryOrderCard from '~/domains/cart/ui/summary-order-card.vue'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useGetCart } from '~/domains/cart/queries/cart.query'
import { useRequestCheckoutQuote } from '~/domains/checkout/composables/use-request-checkout-quote'
import { toastCustom } from '~/shared/config/toast'

definePageMeta({ layout: 'market' })

const cartStore = useCartStore()
const toast = useToast()

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()

const {
  quote,
  requestQuote,
  clearQuote,
} = useRequestCheckoutQuote({ mode: 'cart' })

onBeforeUnmount(() => {
  cartStore.resetStateCheckoutCart()
  if (cartStore.additionInfoShopCarts.size) {
    cartStore.additionInfoShopCarts.clear()
  }
})

const quoteShopByShopId = computed(() => new Map(
  (quote.value?.shops ?? []).map(shop => [shop.shop_id, shop]),
))

const hasCheckoutCartItems = computed(
  () => (dataGetCart.value?.cart?.shop_groups?.length ?? 0) > 0,
)

/**
 * Every input that changes the server-computed charge or estimate. Re-request
 * whenever it changes so the review never shows a stale accepted quote.
 */
const quoteInputKey = computed(() => JSON.stringify({
  address: cartStore.stateCheckoutCart.address,
  adjustments: Array.from(cartStore.additionInfoShopCarts),
  merchandise: dataGetCart.value?.summary?.total_minor ?? null,
}))

async function refreshQuote() {
  if (!cartStore.stateCheckoutCart.address) {
    return
  }

  try {
    await requestQuote()
  }
  catch {
    // Submitting the order clears the cart, which ends the review. A quote that
    // fails because there is nothing left to quote is not a buyer error.
    if (!hasCheckoutCartItems.value || cartStore.stateCheckoutCart.isPendingCreateOrder) {
      return
    }

    toast.add({
      ...toastCustom.error,
      title: 'Could not load shipping and totals',
      description: 'Please review your address and try again.',
    })
  }
}

// A quote is accepted for one address, so changing the address invalidates it.
watch(() => cartStore.stateCheckoutCart.address, () => {
  clearQuote()
})

watch(
  quoteInputKey,
  () => {
    if (!hasCheckoutCartItems.value) {
      return
    }

    void refreshQuote()
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="isPendingGetCart"
    class="grid h-[80vh] w-full place-content-center"
  >
    <LoadingSvg :child-class="'!w-12 !h-12'" />
  </div>

  <div
    v-else-if="dataGetCart?.cart && dataGetCart.cart.shop_groups?.length > 0"
    class="py-16"
  >
    <div class="grid grid-cols-12 gap-16">
      <div class="col-span-8">
        <ReviewShippingAndPayment
          v-model:checkout-state="cartStore.stateCheckoutCart"
          class="mb-12"
        />

        <div
          v-for="shopCart of dataGetCart.cart.shop_groups"
          :key="shopCart.shop.id"
        >
          <ShopCart
            :shop-cart="shopCart"
            :quote-shop="quoteShopByShopId.get(shopCart.shop.id)"
            :checkout-currency="quote?.checkout_currency"
          />
        </div>
      </div>

      <div class="col-span-4">
        <div class="sticky top-24">
          <SummaryOrderCard
            :loading="isPendingGetCart"
            :summary-order="dataGetCart?.summary"
            :quote="quote ?? undefined"
          />
          <CreateOrderBtn />
        </div>
      </div>
    </div>
  </div>
</template>
