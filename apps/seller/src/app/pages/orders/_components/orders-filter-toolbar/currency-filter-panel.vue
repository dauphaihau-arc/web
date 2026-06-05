<script lang="ts" setup>
import type { CurrencyOption } from '@arc/utils'
import type { OrderCurrencyFilterDraft } from './order-filter.types'

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
</script>

<template>
  <USelectMenu
    v-model="model.currency"
    searchable
    :options="selectCurrencyOptions"
    value-attribute="id"
    option-attribute="shortLabel"
    size="lg"
  >
    <template #option="{ option: currencyOption }">
      {{ currencyOption.displayLabel }}
    </template>
  </USelectMenu>
</template>
