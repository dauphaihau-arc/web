<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import CreateOrderBtn from './_components/create-order-btn.vue'
import PaymentOptions from './_components/payment-options.vue'
import ReviewShippingAndPayment from './_components/review-shipping-and-payment.vue'
import ShopCart from './_components/shop-cart.vue'
import SummaryOrder from './_components/summary-order.vue'
import UserAddressShipping from './_components/user-address-shipping.vue'
import CheckoutStepper from '~/app/components/checkout-stepper.vue'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { CheckoutCartSteps } from '~/shared/stores/cart/cart.store.types'
import { useGetCart } from '~/shared/server-state/cart/cart.query'

definePageMeta({ layout: 'market' })

const cartStore = useCartStore()

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()

onBeforeUnmount(() => {
  cartStore.resetStateCheckoutCart()
  if (cartStore.additionInfoShopCarts.size) {
    cartStore.additionInfoShopCarts.clear()
  }
})

const steps = ['Billing Address', 'Payment', 'Review & Confirmation']
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
      class="mx-auto mb-24 max-w-[30rem]"
      :steps="steps"
      :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
    />
    <div class="grid grid-cols-12 gap-16">
      <div class="col-span-8">
        <UserAddressShipping
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.ADDRESS_SHIPPING"
          class="mb-10"
        />
        <PaymentOptions
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.PAYMENT"
        />

        <div
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.REVIEW_CONFIRMATION
            || cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.ORDER"
        >
          <ReviewShippingAndPayment class="mb-12" />
          <div
            v-for="shopCart of dataGetCart.cart.shop_groups"
            :key="shopCart.shop.id"
          >
            <ShopCart :shop-cart="shopCart" />
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <SummaryOrder />
        <CreateOrderBtn />
      </div>
    </div>
  </div>
</template>
