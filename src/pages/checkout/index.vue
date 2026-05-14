<script lang="ts" setup>
import { useCartStore } from '~/stores/cart'
import { CHECKOUT_NOW_STEPS } from '~/types/pages/checkout'
import CheckoutCreateOrderBtn from '~/components/pages/checkout/CheckoutCreateOrderBtn.vue'
import { useGetCart } from '~/services/cart'
import type { Cart } from '~/types/cart'

definePageMeta({ layout: 'market', middleware: ['auth', 'checkout'] })

const route = useRoute()
const cartStore = useCartStore()

const tempCartId = route.query['c'] as Cart['id']

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart({ cart_id: tempCartId })

const steps = ['Billing Address', 'Payment', 'Review & Confirmation']

onUnmounted(() => {
  cartStore.resetStateCheckoutNow()
})
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
      class="mx-auto mb-24 max-w-[30rem]"
      :steps="steps"
      :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
    />
    <div class="grid grid-cols-12 gap-16">
      <div class="col-span-8">
        <CheckoutUserAddressShipping
          v-show="cartStore.stateCheckoutNow.currentStep === CHECKOUT_NOW_STEPS.ADDRESS_SHIPPING"
          class="mb-10"
        />

        <CheckoutPaymentOptions
          v-show="cartStore.stateCheckoutNow.currentStep === CHECKOUT_NOW_STEPS.PAYMENT"
        />

        <div
          v-show="cartStore.stateCheckoutNow.currentStep === CHECKOUT_NOW_STEPS.REVIEW_CONFIRMATION
            || cartStore.stateCheckoutNow.currentStep === CHECKOUT_NOW_STEPS.ORDER"
        >
          <CheckoutReviewShippingAndPayment class="mb-12" />
          <CheckoutShopCart />
        </div>
      </div>

      <div class="col-span-4">
        <SummaryOrderCard
          :loading="isPendingGetCart"
          :summary-order="dataGetCart?.summary_order"
        />
        <CheckoutCreateOrderBtn />
      </div>
    </div>
  </div>
</template>
