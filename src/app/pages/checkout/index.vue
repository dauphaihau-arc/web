<script lang="ts" setup>
import { useCartStore } from '~/shared/stores/cart'
import { CheckoutNowSteps } from '~/shared/types/pages/checkout'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import CheckoutStepper from '~/app/components/checkout-stepper.vue'
import SummaryOrderCard from '~/app/components/summary-order-card.vue'
import CheckoutCreateOrderBtn from '~/app/components/checkout/checkout-create-order-btn.vue'
import CheckoutPaymentOptions from '~/app/components/checkout/checkout-payment-options.vue'
import CheckoutReviewShippingAndPayment from '~/app/components/checkout/checkout-review-shipping-and-payment.vue'
import CheckoutShopCart from '~/app/components/checkout/checkout-shop-cart.vue'
import CheckoutUserAddressShipping from '~/app/components/checkout/checkout-user-address-shipping.vue'
import { useGetCart } from '~/shared/server-state/cart'
import type { Cart } from '~/shared/types/cart'

definePageMeta({ layout: 'market', middleware: ['auth', 'checkout'] })

const route = useRoute()
const cartStore = useCartStore()

const tempCartId = route.query['c'] as Cart['id']

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart({ cartId: tempCartId })

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
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.addressShipping"
          class="mb-10"
        />

        <CheckoutPaymentOptions
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.payment"
        />

        <div
          v-show="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.reviewConfirmation
            || cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.order"
        >
          <CheckoutReviewShippingAndPayment class="mb-12" />
          <CheckoutShopCart />
        </div>
      </div>

      <div class="col-span-4">
        <SummaryOrderCard
          :loading="isPendingGetCart"
          :summary-order="dataGetCart?.summary"
        />
        <CheckoutCreateOrderBtn />
      </div>
    </div>
  </div>
</template>
