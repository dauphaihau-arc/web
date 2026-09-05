<script setup lang="ts">
import { CheckoutCartSteps } from '~/domains/cart/stores/cart.store.types'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useSubmitCartCheckout } from '~/domains/checkout/composables/use-submit-cart-checkout'

const cartStore = useCartStore()
const { submitCartCheckout } = useSubmitCartCheckout()

function nextStep() {
  cartStore.stateCheckoutCart.currentStep++
}
</script>

<template>
  <div class="mx-auto mt-8">
    <UButton
      v-if="
        cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.ADDRESS_SHIPPING
          || cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.PAYMENT
      "
      block
      size="xl"
      :disabled="!cartStore.stateCheckoutCart.address"
      :ui="{ rounded: 'shadow-border' }"
      @click="nextStep"
    >
      Continue
    </UButton>
    <UButton
      v-else-if="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.REVIEW_CONFIRMATION"
      block
      size="xl"
      :loading="cartStore.stateCheckoutCart.isPendingCreateOrder"
      :ui="{ rounded: 'shadow-border' }"
      @click="submitCartCheckout"
    >
      Complete Order
    </UButton>
  </div>
</template>

<style scoped>

</style>
