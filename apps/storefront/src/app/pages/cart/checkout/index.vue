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

const changeUserAddress = () => {
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
            <ShopCart :shop-cart="shopCart" />
          </div>
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
