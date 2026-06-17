<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import CreateOrderBtn from './_components/create-order-btn.vue'
import PaymentOptions from './_components/payment-options.vue'
import ReviewShippingAndPayment from './_components/review-shipping-and-payment.vue'
import ShopCart from './_components/shop-cart.vue'
import UserAddressShipping from './_components/user-address-shipping.vue'
import SummaryOrderCard from '~/app/components/summary-order-card.vue'
import CheckoutStepper from '~/app/components/checkout-stepper.vue'
import { CheckoutNowSteps } from '~/shared/stores/cart/cart.store.types'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { useGetCart } from '~/shared/server-state/cart/cart.query'

definePageMeta({ layout: 'market', middleware: ['checkout'] })

const route = useRoute()
const cartStore = useCartStore()

const tempCartId = route.query['c'] as string

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
        <UserAddressShipping
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.ADDRESS_SHIPPING"
          class="mb-10"
        />

        <PaymentOptions
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.PAYMENT"
        />

        <div
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.REVIEW_CONFIRMATION
            || cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.ORDER"
        >
          <ReviewShippingAndPayment class="mb-12" />
          <ShopCart />
        </div>
      </div>

      <div class="col-span-4">
        <SummaryOrderCard
          :loading="isPendingGetCart"
          :summary-order="dataGetCart?.summary"
        />
        <CreateOrderBtn />
      </div>
    </div>
  </div>
</template>
