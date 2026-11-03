<script setup lang="ts">
import type { MarketCurrencies } from '@arc/enums/market'
import type { CurrencyOption } from '@arc/utils/currency-options'

const props = withDefaults(defineProps<{
  modelValue: MarketCurrencies
  options: CurrencyOption[]
  disabled?: boolean
  size?: 'md' | 'lg' | 'xl'
}>(), {
  size: 'xl',
})

const emit = defineEmits<{
  'update:modelValue': [value: MarketCurrencies]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    searchable
    :size="props.size"
    :disabled="props.disabled"
    :options="props.options"
    value-attribute="id"
    option-attribute="displayLabel"
    :ui-menu="{
      container: 'z-[60]',
      select: '!normal-case',
      option: { base: '!normal-case' },
    }"
  />
</template>
