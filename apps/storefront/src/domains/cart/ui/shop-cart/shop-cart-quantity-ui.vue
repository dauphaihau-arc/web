<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

const props = withDefaults(defineProps<{
  stock?: number
  disabled?: boolean
  size?: 'md' | 'lg'
}>(), {
  stock: undefined,
  disabled: false,
  size: 'md',
})

const quantity = defineModel<number>('quantity', { required: true })

const decreaseQty = () => {
  if (quantity.value === 1) return
  quantity.value--
}

const increaseQty = () => {
  quantity.value++
}
</script>

<template>
  <UButtonGroup
    :size="props.size"
    orientation="horizontal"
    class="inline-flex w-auto"
  >
    <UButton
      :icon="ICON_NAME_BY_ALIAS['minus']"
      color="white"
      class="w-11 justify-center rounded-l-md rounded-r-none"
      :disabled="props.disabled"
      @click="decreaseQty"
    />
    <UInput
      v-model.number="quantity"
      v-numeric
      v-max-number="props.stock"
      class="w-20 rounded-l-none"
      type="number"
      :disabled="props.disabled"
      :ui="{ base: 'text-center rounded-l-none' }"
    />
    <UButton
      :icon="ICON_NAME_BY_ALIAS['plus']"
      color="white"
      class="w-11 justify-center rounded-l-none rounded-r-md"
      :disabled="props.disabled"
      @click="increaseQty"
    />
  </UButtonGroup>
</template>
