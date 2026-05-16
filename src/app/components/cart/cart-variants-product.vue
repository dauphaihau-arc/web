<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import type { ResponseGetCartProductCart } from '~/shared/types/request-api/cart'

const props = defineProps<{ productCart: ResponseGetCartProductCart }>()

const state = reactive({
  v1: '',
  v2: '',
})

onMounted(() => {
  if (props.productCart.inventory.variantName) {
    const [v1, v2] = props.productCart.inventory.variantName.split('-')
    state.v1 = v1
    state.v2 = v2
  }
})
</script>

<template>
  <div class="">
    <div
      v-if="props.productCart.product.variantGroupName"
      class="text-lg text-zinc-500"
    >
      {{ props.productCart.product.variantGroupName }}: {{ state.v1 }}
    </div>
    <div
      v-if="props.productCart.product.variantSubGroupName"
      class="text-lg text-zinc-500"
    >
      {{ props.productCart.product.variantSubGroupName }}: {{ state.v2 }}
    </div>
  </div>
</template>
