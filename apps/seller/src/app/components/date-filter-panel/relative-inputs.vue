<script lang="ts" setup>
import type { OrderDateFilterDraft } from './order-filter.types'

const model = defineModel<OrderDateFilterDraft>({ required: true })

defineProps<{
  unitOptions: Array<{ label: string, value: OrderDateFilterDraft['unit'] }>
}>()

function setAmount(value: string | number) {
  model.value.amount = String(value ?? '')
}

function setUnit(value: OrderDateFilterDraft['unit']) {
  model.value.unit = value
}
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="hidden text-primary sm:block">
      <AppIcon
        name="arrowForward"
        class="size-7"
      />
    </div>

    <UInput
      :model-value="model.amount"
      type="number"
      min="1"
      size="lg"
      placeholder="7"
      @update:model-value="setAmount"
    />

    <USelectMenu
      :model-value="model.unit"
      :options="unitOptions"
      value-attribute="value"
      option-attribute="label"
      size="lg"
      class="sm:w-36"
      @update:model-value="setUnit"
    />
  </div>
</template>
