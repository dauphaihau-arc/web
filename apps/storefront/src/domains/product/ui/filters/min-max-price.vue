<script setup lang="ts">
type PriceOption = {
  value: string
  label: string
}

const props = defineProps<{
  price: string
  minPrice: string
  maxPrice: string
  options: PriceOption[]
}>()

const emit = defineEmits<{
  'update:price': [value: string]
  'update:minPrice': [value: string]
  'update:maxPrice': [value: string]
}>()

function sanitizeMajorPriceInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, '')
  const segments = normalized.split('.')

  if (segments.length <= 1) {
    return normalized
  }

  return `${segments[0]}.${segments.slice(1).join('')}`
}

function updateMinPrice(value: unknown) {
  emit('update:minPrice', sanitizeMajorPriceInput(String(value ?? '')))
}

function updateMaxPrice(value: unknown) {
  emit('update:maxPrice', sanitizeMajorPriceInput(String(value ?? '')))
}
</script>

<template>
  <div>
    <RadioGroupInput
      :model-value="props.price"
      :options="props.options"
      @update:model-value="emit('update:price', String($event))"
    />

    <div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <UInput
        :model-value="props.minPrice"
        placeholder="Low"
        :disabled="props.price !== 'custom'"
        @update:model-value="updateMinPrice"
      />
      <span class="text-sm text-text-subtle">to</span>
      <UInput
        :model-value="props.maxPrice"
        placeholder="High"
        :disabled="props.price !== 'custom'"
        @update:model-value="updateMaxPrice"
      />
    </div>
  </div>
</template>
