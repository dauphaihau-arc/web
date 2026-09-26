<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import CreateOrderBtn from './_components/create-order-btn.vue'
import PaymentOptions from '~/domains/checkout/ui/payment-options.vue'
import ReviewShippingAndPayment from '~/domains/checkout/ui/review-shipping-and-payment.vue'
import ShopCart from './_components/shop-cart.vue'
import UserAddressShipping from '~/domains/checkout/ui/user-address-shipping.vue'
import SummaryOrderCard from '~/domains/cart/ui/summary-order-card.vue'
import CheckoutStepper from '~/domains/checkout/ui/checkout-stepper.vue'
import { CheckoutNowSteps } from '~/domains/cart/stores/cart.store.types'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useGetCart } from '~/domains/cart/queries/cart.query'
import { useRequestCheckoutQuote } from '~/domains/checkout/composables/use-request-checkout-quote'
import { toastCustom } from '~/shared/config/toast'

definePageMeta({ layout: 'market', middleware: ['checkout'] })

const route = useRoute()
const cartStore = useCartStore()
const toast = useToast()

const tempCartId = route.query['c'] as string

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart({ cart_id: tempCartId })

const {
  quote,
  isPendingQuote,
  requestQuote,
  clearQuote,
} = useRequestCheckoutQuote({ mode: 'buy-now', tempCartId })

const quoteShopByShopId = computed(() => new Map(
  (quote.value?.shops ?? []).map(shop => [shop.shop_id, shop]),
))

const checkoutShopId = computed(() => dataGetCart.value?.cart?.shop_groups[0]?.shop.id)

const hasCheckoutCartItems = computed(
  () => (dataGetCart.value?.cart?.shop_groups?.length ?? 0) > 0,
)

const quoteInputKey = computed(() => JSON.stringify({
  address: cartStore.stateCheckoutNow.address,
  promoCodes: cartStore.stateCheckoutNow.promoCodes,
  note: cartStore.stateCheckoutNow.note,
  merchandise: dataGetCart.value?.summary?.total_minor ?? null,
}))

async function refreshQuote() {
  if (!cartStore.stateCheckoutNow.address) {
    return
  }

  try {
    await requestQuote()
  }
  catch {
    // Submitting the order clears the cart, which ends the review. A quote that
    // fails because there is nothing left to quote is not a buyer error.
    if (!hasCheckoutCartItems.value || cartStore.stateCheckoutNow.isPendingCreateOrder) {
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
  [() => cartStore.stateCheckoutNow.currentStep, quoteInputKey],
  ([step]) => {
    if (step !== CheckoutNowSteps.REVIEW_CONFIRMATION || !hasCheckoutCartItems.value) {
      return
    }

    void refreshQuote()
  },
  { immediate: true },
)

onUnmounted(() => {
  cartStore.resetStateCheckoutNow()
})

const changeUserAddress = () => {
  clearQuote()
  cartStore.stateCheckoutNow.currentStep = CheckoutNowSteps.ADDRESS_SHIPPING
}

const changePayment = () => {
  cartStore.stateCheckoutNow.currentStep = CheckoutNowSteps.PAYMENT
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
    v-else-if="dataGetCart?.cart"
    class="py-16"
  >
    <CheckoutStepper
      v-model="cartStore.stateCheckoutNow.currentStep"
      class="mx-auto mb-24 max-w-4xl"
      :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
    />

    <div class="grid grid-cols-12 gap-16">
      <div class="col-span-8">
        <UserAddressShipping
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.ADDRESS_SHIPPING"
          v-model:address="cartStore.stateCheckoutNow.address"
          v-model:guest-email="cartStore.stateCheckoutNow.guestEmail"
          class="mb-10"
        />

        <PaymentOptions
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.PAYMENT"
          v-model="cartStore.stateCheckoutNow.paymentType"
          direction="horizontal"
        />

        <div
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.REVIEW_CONFIRMATION
            || cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.ORDER"
        >
          <ReviewShippingAndPayment
            :checkout-state="cartStore.stateCheckoutNow"
            :on-change-user-address="changeUserAddress"
            :on-change-payment="changePayment"
            class="mb-12"
          />
          <ShopCart
            :quote-shop="checkoutShopId ? quoteShopByShopId.get(checkoutShopId) : undefined"
            :checkout-currency="quote?.checkout_currency"
            :is-pending-quote="isPendingQuote"
          />
        </div>
      </div>

      <div class="col-span-4">
        <SummaryOrderCard
          :loading="isPendingGetCart"
          :summary-order="dataGetCart?.summary"
          :quote="quote ?? undefined"
        />
        <CreateOrderBtn />
      </div>
    </div>
  </div>
</template>
