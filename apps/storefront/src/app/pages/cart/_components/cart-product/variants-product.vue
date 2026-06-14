<script setup lang="ts">
import type { CartProductItem } from '~/shared/api/cart/cart.shared'

const props = defineProps<{ productCart: CartProductItem }>()
</script>

<template>
  <div
    v-if="props.productCart.inventory.variant_name"
    class="text-lg text-text-muted"
  >
    {{ props.productCart.inventory.variant_name }}
  </div>
</template>
