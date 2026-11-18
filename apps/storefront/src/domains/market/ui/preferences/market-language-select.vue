<script setup lang="ts">
import type { MarketLanguages } from '@arc/enums/market'
import type { LanguageOption } from './preference-options'

const props = withDefaults(defineProps<{
  modelValue: MarketLanguages
  options: LanguageOption[]
  disabled?: boolean
  size?: 'md' | 'lg' | 'xl'
}>(), {
  size: 'xl',
})

const emit = defineEmits<{
  'update:modelValue': [value: MarketLanguages]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    data-testid="market-preferences-language"
    :size="props.size"
    :disabled="props.disabled"
    :options="props.options"
    value-attribute="id"
    option-attribute="label"
    :ui-menu="{
      container: 'z-[60]',
      select: '!normal-case',
      option: { base: '!normal-case' },
    }"
  />
</template>
