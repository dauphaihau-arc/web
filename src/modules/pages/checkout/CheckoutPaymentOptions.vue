<script lang="ts" setup>
import { PAYMENT_TYPES } from '~/shared/config/enums/order'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const cartStore = useCartStore()

const paymentOptions = [
  { value: PAYMENT_TYPES.CASH, label: 'Cash on delivery', description: 'Pay with cash when your order is delivered' },
]
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4">
      <legend class="mb-1 text-xl font-bold text-gray-700 dark:text-gray-200">
        Payment options
      </legend>
      <RadioGroupInput
        v-model="cartStore.stateCheckoutNow.paymentType"
        :options="paymentOptions"
      >
        <template #label="{ option }">
          <div class="mb-6 flex w-full flex-col gap-1">
            <div class="leading-0 font-semibold text-customGray-950">
              {{ option.label }}
            </div>
            <div class="font-normal text-gray-500">
              {{ option.description }}
            </div>
          </div>
        </template>
      </RadioGroupInput>
    </div>
  </UCard>
</template>
