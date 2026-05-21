<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import type { CartProductItem } from '~/shared/api/cart/cart.shared'

const props = defineProps<{ productCart: CartProductItem }>()

const state = reactive({
  v1: '',
  v2: '',
})

onMounted(() => {
  if (props.productCart.inventory.variant_name) {
    const [v1, v2] = props.productCart.inventory.variant_name.split('-')
    state.v1 = v1
    state.v2 = v2
  }
})
</script>

<template>
  <div class="">
    <div
      v-if="props.productCart.product.variant_group_name"
      class="text-lg text-zinc-500"
    >
      {{ props.productCart.product.variant_group_name }}: {{ state.v1 }}
    </div>
    <div
      v-if="props.productCart.product.variant_sub_group_name"
      class="text-lg text-zinc-500"
    >
      {{ props.productCart.product.variant_sub_group_name }}: {{ state.v2 }}
    </div>
  </div>
</template>
