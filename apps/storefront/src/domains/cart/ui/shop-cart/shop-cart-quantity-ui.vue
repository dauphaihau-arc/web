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

// Guards live in the flags so a disabled button and a no-op click share one source.
const canDecrease = computed(() => !props.disabled && quantity.value > 1)
const canIncrease = computed(
  () => !props.disabled && (props.stock === undefined || quantity.value < props.stock),
)

const decreaseQty = () => {
  if (!canDecrease.value) return
  quantity.value--
}

const increaseQty = () => {
  if (!canIncrease.value) return
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
      :disabled="!canDecrease"
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
      :disabled="!canIncrease"
      @click="increaseQty"
    />
  </UButtonGroup>
</template>
