<script lang="ts" setup>
import LoadingSvg from '~/shared/components/loading-svg.vue'
import CheckoutStepper from '~/modules/pages/checkout-stepper.vue'
import CartCheckoutCreateOrderBtn from '~/modules/pages/cart/checkout/cart-checkout-create-order-btn.vue'
import CartCheckoutPaymentOptions from '~/modules/pages/cart/checkout/cart-checkout-payment-options.vue'
import CartCheckoutReviewShippingAndPayment from '~/modules/pages/cart/checkout/cart-checkout-review-shipping-and-payment.vue'
import CartCheckoutShopCart from '~/modules/pages/cart/checkout/cart-checkout-shop-cart.vue'
import CartCheckoutSummaryOrder from '~/modules/pages/cart/checkout/cart-checkout-summary-order.vue'
import CartCheckoutUserAddressShipping from '~/modules/pages/cart/checkout/cart-checkout-user-address-shipping.vue'
import { useCartStore } from '~/shared/stores/cart'
import { CheckoutCartSteps } from '~/shared/types/pages/cart/checkout'
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
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.addressShipping"
          class="mb-10"
        />
        <CartCheckoutPaymentOptions
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.payment"
        />

        <div
          v-show="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.reviewConfirmation
            || cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.order"
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
