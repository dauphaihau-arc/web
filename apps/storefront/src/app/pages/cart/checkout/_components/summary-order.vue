<script setup lang="ts">
import SummaryOrderCard from '~/domains/cart/ui/summary-order-card.vue'
import { useGetCart } from '~/domains/cart/queries/cart.query'

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()
</script>

<template>
  <SummaryOrderCard
    :loading="isPendingGetCart"
    :summary-order="dataGetCart?.summary"
  />
</template>

<style scoped>
</style>
