<script setup lang="ts">
import Stepper from '@arc/ui/primitives/stepper.vue'
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants'
import type { StepperItem } from '@arc/ui/primitives/stepper.types'

/*
  use in checkout, cart, cart/checkout, page
 */
export type CheckoutStepperItem = StepperItem & {
  title: string
  description: string
  icon: AppIconAlias
}

const defaultSteps = [
  {
    title: 'Billing Address',
    description: 'Choose where your order will ship.',
    icon: 'location',
  },
  {
    title: 'Payment',
    description: 'Select your payment method.',
    icon: 'creditCard',
  },
  {
    title: 'Review & Confirmation',
    description: 'Review details before placing the order.',
    icon: 'receiptText',
  },
] as const satisfies readonly CheckoutStepperItem[]

const props = defineProps<{
  steps?: readonly CheckoutStepperItem[]
  disabled: boolean
}>()

const model = defineModel<number>({
  required: true,
  default: 0,
})

const steps = computed(() => props.steps ?? defaultSteps)

const items = computed(() => [...steps.value])

const stepperModel = computed({
  get() {
    return Math.min(model.value, Math.max(steps.value.length - 1, 0))
  },
  set(value: string | number | undefined) {
    if (typeof value !== 'number') {
      return
    }

    model.value = value
  },
})
</script>

<template>
  <Stepper
    v-model="stepperModel"
    :items="items"
    :disabled="disabled"
    class="w-full"
  />
</template>
