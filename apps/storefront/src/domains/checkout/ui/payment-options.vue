<script lang="ts" setup>
import { PaymentTypes } from '@arc/enums/order'

withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  labelContentClass?: string
}>(), {
  direction: undefined,
  labelContentClass: '',
})

const paymentType = defineModel<PaymentTypes>({ required: true })

const paymentOptions = [
  { value: PaymentTypes.CARD, label: 'Credit / Debit Card', description: 'We support Mastercard, Visa and Stripe' },
  { value: PaymentTypes.CASH, label: 'Cash on delivery', description: 'Pay with cash when your order is delivered' },
]
</script>

<template>
  <RadioGroupInput
    v-model="paymentType"
    :options="paymentOptions"
    :direction="direction"
  >
    <template #label="{ option }">
      <div :class="labelContentClass">
        <div class="font-semibold text-text-strong">
          {{ option.label }}
        </div>
        <div class="font-normal text-text-muted">
          {{ option.description }}
        </div>
      </div>
    </template>
  </RadioGroupInput>
</template>
