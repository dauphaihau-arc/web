<script lang="ts" setup>
import { useCartStore } from '~/stores/cart'
import { CHECKOUT_NOW_STEPS } from '~/types/pages/checkout'

const cartStore = useCartStore()

const changeUserAddress = () => {
  cartStore.stateCheckoutNow.currentStep = CHECKOUT_NOW_STEPS.ADDRESS_SHIPPING
}
const changePayment = () => {
  cartStore.stateCheckoutNow.currentStep = CHECKOUT_NOW_STEPS.PAYMENT
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
              {{ cartStore.stateCheckoutNow.address?.full_name }}
            </div>
            <div class="">
              {{ cartStore.stateCheckoutNow.address?.address1 }}
            </div>
            <div class="flex gap-2">
              <div>{{ cartStore.stateCheckoutNow.address?.city }}</div>
              <div>{{ cartStore.stateCheckoutNow.address?.zip }}</div>
            </div>
            <div class="">
              {{ cartStore.stateCheckoutNow.address?.country }}
            </div>
          </div>

          <UButton
            :padded="false"
            variant="link"
            :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
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
              {{ cartStore.stateCheckoutNow.payment_type }}
            </div>
          </div>

          <UButton
            :padded="false"
            variant="link"
            :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
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
