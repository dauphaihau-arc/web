<script setup lang="ts">
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useSubmitCartCheckout } from '~/domains/checkout/composables/use-submit-cart-checkout'

const cartStore = useCartStore()
const { submitCartCheckout } = useSubmitCartCheckout()
</script>

<template>
  <div class="mx-auto mt-8">
    <UButton
      block
      size="xl"
      :disabled="!cartStore.stateCheckoutCart.address"
      :loading="cartStore.stateCheckoutCart.isPendingCreateOrder"
      :ui="{ rounded: 'shadow-border' }"
      @click="submitCartCheckout"
    >
      Complete Order
    </UButton>
  </div>
</template>
