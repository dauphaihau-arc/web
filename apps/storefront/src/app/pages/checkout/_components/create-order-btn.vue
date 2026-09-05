<script setup lang="ts">
import { CheckoutNowSteps } from '~/domains/cart/stores/cart.store.types'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useSubmitBuyNowCheckout } from '~/domains/checkout/composables/use-submit-buy-now-checkout'

const cartStore = useCartStore()
const { submitBuyNowCheckout } = useSubmitBuyNowCheckout()

function nextStep() {
  cartStore.stateCheckoutNow.currentStep++
}
</script>

<template>
  <div class="mx-auto mt-8">
    <UButton
      v-if="
        cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.ADDRESS_SHIPPING
          || cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.PAYMENT
      "
      block
      size="xl"
      :disabled="!cartStore.stateCheckoutNow.address"
      :ui="{ rounded: 'shadow-border' }"
      @click="nextStep"
    >
      Continue
    </UButton>
    <UButton
      v-else-if="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.REVIEW_CONFIRMATION"
      block
      size="xl"
      :loading="cartStore.stateCheckoutNow.isPendingCreateOrder"
      :ui="{ rounded: 'shadow-border' }"
      @click="submitBuyNowCheckout"
    >
      Complete Order
    </UButton>
  </div>
</template>

<style scoped>

</style>
