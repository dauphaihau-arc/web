<script lang="ts" setup>
import type { OrderAmountFilterDraft } from './order-filter.types'

const model = defineModel<OrderAmountFilterDraft>({ required: true })

const operatorOptions = [
  { label: 'Exactly', value: 'eq' },
  { label: 'More than', value: 'gte' },
  { label: 'Less than', value: 'lte' },
]
</script>

<template>
  <div class="space-y-4">
    <USelectMenu
      v-model="model.operator"
      :options="operatorOptions"
      value-attribute="value"
      name-attribute="label"
      size="lg"
      class="w-full"
    />

    <UInput
      v-model="model.amount"
      type="number"
      min="0"
      step="0.01"
      size="lg"
      placeholder="500.00"
    />
  </div>
</template>
