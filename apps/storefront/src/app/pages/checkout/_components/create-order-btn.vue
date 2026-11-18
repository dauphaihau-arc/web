<script setup lang="ts">
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useSubmitBuyNowCheckout } from '~/domains/checkout/composables/use-submit-buy-now-checkout'

const cartStore = useCartStore()
const { t } = useI18n()
const { submitBuyNowCheckout } = useSubmitBuyNowCheckout()
</script>

<template>
  <div class="mx-auto mt-8">
    <UButton
      block
      size="xl"
      :disabled="!cartStore.stateCheckoutNow.address"
      :loading="cartStore.stateCheckoutNow.isPendingCreateOrder"
      :ui="{ rounded: 'shadow-border' }"
      @click="submitBuyNowCheckout"
    >
      {{ t('checkout.actions.completeOrder') }}
    </UButton>
  </div>
</template>
