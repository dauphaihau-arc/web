<script lang="ts" setup>
import type { OrderAmountFilterDraft } from '~/app/components/date-filter-panel/order-filter.types'

const model = defineModel<OrderAmountFilterDraft>({ required: true })

const operatorOptions = [
  { label: 'Exactly', value: 'eq' },
  { label: 'More than', value: 'gte' },
  { label: 'Less than', value: 'lte' },
]

function setOperator(value: OrderAmountFilterDraft['operator']) {
  model.value.operator = value
}

function setAmount(value: string | number) {
  model.value.amount = String(value ?? '')
}
</script>

<template>
  <div class="space-y-4">
    <USelectMenu
      :model-value="model.operator"
      :options="operatorOptions"
      value-attribute="value"
      name-attribute="label"
      size="lg"
      class="w-full"
      @update:model-value="setOperator"
    />

    <UInput
      :model-value="model.amount"
      type="number"
      min="0"
      step="0.01"
      size="lg"
      placeholder="500.00"
      @update:model-value="setAmount"
    />
  </div>
</template>
