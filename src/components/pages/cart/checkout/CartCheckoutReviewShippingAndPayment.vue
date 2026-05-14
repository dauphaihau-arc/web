<script lang="ts" setup>
import { useCartStore } from '~/stores/cart'
import { CHECKOUT_CART_STEPS } from '~/types/pages/cart/checkout'

const cartStore = useCartStore()

const changeUserAddress = () => {
  cartStore.stateCheckoutCart.currentStep = CHECKOUT_CART_STEPS.ADDRESS_SHIPPING
}

const changePayment = () => {
  cartStore.stateCheckoutCart.currentStep = CHECKOUT_CART_STEPS.PAYMENT
}
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4">
      <legend class="mb-1 text-xl font-bold text-gray-700 dark:text-gray-200">
        Shipping & Payment
      </legend>

      <div class="grid grid-cols-4">
        <div>
          <div class="mb-1 font-semibold">
            Shipping address
          </div>

          <div class="my-2 flex flex-col">
            <div class="">
              {{ cartStore.stateCheckoutCart.address?.full_name }}
            </div>
            <div class="">
              {{ cartStore.stateCheckoutCart.address?.address1 }}
            </div>
            <div class="flex gap-2">
              <div>{{ cartStore.stateCheckoutCart.address?.city }}</div>
              <div>{{ cartStore.stateCheckoutCart.address?.zip }}</div>
            </div>
            <div class="">
              {{ cartStore.stateCheckoutCart.address?.country }}
            </div>
          </div>

          <UButton
            :padded="false"
            variant="link"
            :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
            @click="changeUserAddress"
          >
            Change
          </UButton>
        </div>

        <div>
          <div class="mb-1 font-semibold">
            Payment method
          </div>
          <div class="my-2 flex flex-col gap-4">
            <div class="capitalize">
              {{ cartStore.stateCheckoutCart.payment_type }}
            </div>
          </div>

          <UButton
            :padded="false"
            variant="link"
            :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
            @click="changePayment"
          >
            Change
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>

</style>
