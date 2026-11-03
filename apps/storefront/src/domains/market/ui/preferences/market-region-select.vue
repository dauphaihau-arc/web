<script setup lang="ts">
import type { MarketRegions } from '@arc/enums/market'

const props = withDefaults(defineProps<{
  modelValue: MarketRegions
  options: string[]
  disabled?: boolean
  pending?: boolean
  size?: 'md' | 'lg' | 'xl'
}>(), {
  size: 'xl',
})

const emit = defineEmits<{
  'update:modelValue': [value: MarketRegions]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    :disabled="props.disabled || props.pending"
    :size="props.size"
    :options="props.options"
    :ui-menu="{ container: 'z-[60]' }"
  />
</template>
