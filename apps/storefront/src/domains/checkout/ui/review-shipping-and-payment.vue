<script lang="ts" setup>
import type { StateCheckoutCart, StateCheckoutNow } from '~/domains/cart/stores/cart.store.types'

const props = defineProps<{
  checkoutState: StateCheckoutCart | StateCheckoutNow
  onChangeUserAddress: () => void
  onChangePayment: () => void
}>()
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4">
      <legend class="mb-1 text-xl font-bold text-text-subtle">
        Shipping & Payment
      </legend>

      <div class="grid grid-cols-3">
        <div>
          <div class="mb-1 font-semibold">
            Shipping address
          </div>

          <div class="my-2 flex flex-col">
            <div class="">
              {{ props.checkoutState.address?.full_name }}
            </div>
            <div class="">
              {{ props.checkoutState.address?.address_1 }}
            </div>
            <div class="flex gap-2">
              <div>{{ props.checkoutState.address?.city }}</div>
              <div>{{ props.checkoutState.address?.zip }}</div>
            </div>
            <div class="">
              {{ props.checkoutState.address?.country }}
            </div>
          </div>

          <UButton
            :padded="false"
            variant="link"
            :disabled="props.checkoutState.isPendingCreateOrder"
            @click="props.onChangeUserAddress"
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
              {{ props.checkoutState.paymentType }}
            </div>
          </div>

          <UButton
            :padded="false"
            variant="link"
            :disabled="props.checkoutState.isPendingCreateOrder"
            @click="props.onChangePayment"
          >
            Change
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
