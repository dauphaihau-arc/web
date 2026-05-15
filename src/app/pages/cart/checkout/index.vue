<script lang="ts" setup>
import { useCartStore } from '~/shared/stores/cart'
import { CHECKOUT_CART_STEPS } from '~/shared/types/pages/cart/checkout'
import { useGetCart } from '~/shared/services/cart'

definePageMeta({ layout: 'market', middleware: ['auth'] })

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
    v-else-if="dataGetCart?.cart && dataGetCart.cart.shopGroups?.length > 0"
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
        <CartCheckoutUserAddressShipping
          v-show="cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.ADDRESS_SHIPPING"
          class="mb-10"
        />
        <CartCheckoutPaymentOptions
          v-show="cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.PAYMENT"
        />

        <div
          v-show="cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.REVIEW_CONFIRMATION
            || cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.ORDER"
        >
          <CartCheckoutReviewShippingAndPayment class="mb-12" />
          <div
            v-for="shopCart of dataGetCart.cart.shopGroups"
            :key="shopCart.shop.id"
          >
            <CartCheckoutShopCart :shop-cart="shopCart" />
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <CartCheckoutSummaryOrder />
        <CartCheckoutCreateOrderBtn />
      </div>
    </div>
  </div>
</template>
