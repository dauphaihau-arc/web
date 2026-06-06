<script lang="ts" setup>
import { PaymentTypes } from '@arc/enums/order'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const cartStore = useCartStore()

const paymentOptions = [
  { value: PaymentTypes.CARD, label: 'Credit / Debit Card', description: 'We support Mastercard, Visa and Stripe' },
  { value: PaymentTypes.CASH, label: 'Cash on delivery', description: 'Pay with cash when your order is delivered' },
]
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4">
      <legend class="mb-1 text-xl font-bold text-text-subtle">
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
            <div class="font-normal text-text-muted">
              {{ option.description }}
            </div>
          </div>
        </template>
      </RadioGroupInput>
    </div>
  </UCard>
</template>
