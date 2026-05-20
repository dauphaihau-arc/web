<script setup lang="ts">
import { useGetCart } from '~/shared/server-state/me/cart/cart.query'

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
