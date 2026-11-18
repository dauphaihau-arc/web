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

const { t } = useI18n()

const paymentOptions = computed(() => [
  {
    value: PaymentTypes.CARD,
    label: t('checkout.payment.card.label'),
    description: t('checkout.payment.card.description'),
  },
  {
    value: PaymentTypes.CASH,
    label: t('checkout.payment.cash.label'),
    description: t('checkout.payment.cash.description'),
  },
])
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
