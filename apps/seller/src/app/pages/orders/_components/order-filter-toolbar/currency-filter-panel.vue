<script lang="ts" setup>
import type { CurrencyOption } from '@arc/utils'
import type { OrderCurrencyFilterDraft } from '~/app/components/date-filter-panel/order-filter.types'

const props = defineProps<{
  currencyOptions: CurrencyOption[]
}>()

const model = defineModel<OrderCurrencyFilterDraft>({ required: true })

const selectCurrencyOptions = computed(() =>
  props.currencyOptions.map(({ id, shortLabel, displayLabel }) => ({
    id,
    shortLabel,
    displayLabel,
  })),
)

function setCurrency(value: string) {
  model.value.currency = value
}
</script>

<template>
  <USelectMenu
    :model-value="model.currency"
    searchable
    :options="selectCurrencyOptions"
    value-attribute="id"
    option-attribute="displayLabel"
    size="lg"
    @update:model-value="setCurrency"
  >
    <template #option="{ option: currencyOption }">
      {{ currencyOption.displayLabel }}
    </template>
  </USelectMenu>
</template>
