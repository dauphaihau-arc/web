<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import type { ResponseGetOrderShopsProduct } from '~/shared/api/me/order/orders.shared'

const { productOrder } = defineProps<{
  productOrder: ResponseGetOrderShopsProduct
}>()

const state = reactive({
  v1: '',
  v2: '',
})

onMounted(() => {
  if (productOrder.inventory.variant) {
    const [v1, v2] = productOrder.inventory.variant.split('-')
    state.v1 = v1
    state.v2 = v2
  }
})
</script>

<template>
  <!--  <div class="space-y-3 text-zinc-500"> -->
  <div
    v-if="productOrder.product.variant_group_name"
    class=""
  >
    {{ productOrder.product.variant_group_name }}: {{ state.v1 }}
  </div>
  <div
    v-if="productOrder.product.variant_sub_group_name"
    class=""
  >
    {{ productOrder.product.variant_sub_group_name }}: {{ state.v2 }}
  </div>
<!--  </div> -->
</template>
