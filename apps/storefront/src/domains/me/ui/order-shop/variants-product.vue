<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import type { ResponseGetOrderShopsProduct } from '~/domains/me/api/order/contracts/order.contract'

const props = defineProps<{
  productOrder: ResponseGetOrderShopsProduct
}>()

const selectedOptions = computed(() => props.productOrder.inventory.selected_options)
</script>

<template>
  <div>
    <div
      v-for="option in selectedOptions"
      :key="`${option.option_id ?? option.option_name}:${option.value_id ?? option.value}`"
    >
      {{ option.option_name }}: {{ option.value }}
    </div>
  </div>
</template>
