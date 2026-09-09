<script setup lang="ts">
import type { CartProductItem } from '~/domains/cart/api/cart.shared'

const props = defineProps<{ productCart: CartProductItem }>()

const selectedOptionsLabel = computed(() =>
  props.productCart.inventory.selected_options
    .map(option => `${option.option_name}: ${option.value}`)
    .join(', '),
)
</script>

<template>
  <div
    v-if="selectedOptionsLabel"
    class="text-lg text-text-muted"
  >
    {{ selectedOptionsLabel }}
  </div>
</template>
