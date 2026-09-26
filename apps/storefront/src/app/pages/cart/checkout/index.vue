<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import CreateOrderBtn from './_components/create-order-btn.vue'
import PaymentOptions from '~/domains/checkout/ui/payment-options.vue'
import ReviewShippingAndPayment from '~/domains/checkout/ui/review-shipping-and-payment.vue'
import ShopCart from './_components/shop-cart.vue'
import SummaryOrderCard from '~/domains/cart/ui/summary-order-card.vue'
import UserAddressShipping from '~/domains/checkout/ui/user-address-shipping.vue'
import CheckoutStepper from '~/domains/checkout/ui/checkout-stepper.vue'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { CheckoutCartSteps } from '~/domains/cart/stores/cart.store.types'
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
  isPendingQuote,
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

watch(
  [() => cartStore.stateCheckoutCart.currentStep, quoteInputKey],
  ([step]) => {
    if (step !== CheckoutCartSteps.REVIEW_CONFIRMATION || !hasCheckoutCartItems.value) {
      return
    }

    void refreshQuote()
  },
  { immediate: true },
)

const changeUserAddress = () => {
  clearQuote()
  cartStore.stateCheckoutCart.currentStep = CheckoutCartSteps.ADDRESS_SHIPPING
}

const changePayment = () => {
  cartStore.stateCheckoutCart.currentStep = CheckoutCartSteps.PAYMENT
}
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
    <CheckoutStepper
      v-model="cartStore.stateCheckoutCart.currentStep"
      class="mx-auto mb-24 max-w-4xl"
      :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
    />
    <div class="grid grid-cols-12 gap-16">
      <div class="col-span-8">
        <UserAddressShipping
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.ADDRESS_SHIPPING"
          v-model:address="cartStore.stateCheckoutCart.address"
          v-model:guest-email="cartStore.stateCheckoutCart.guestEmail"
          class="mb-10"
        />
        <PaymentOptions
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.PAYMENT"
          v-model="cartStore.stateCheckoutCart.paymentType"
          direction="horizontal"
        />

        <div
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.REVIEW_CONFIRMATION
            || cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.ORDER"
        >
          <ReviewShippingAndPayment
            :checkout-state="cartStore.stateCheckoutCart"
            :on-change-user-address="changeUserAddress"
            :on-change-payment="changePayment"
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
              :is-pending-quote="isPendingQuote"
            />
          </div>
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
