<script setup lang="ts">
import { useGetCart } from '~/services/cart'

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()
</script>

<template>
  <SummaryOrderCard
    :loading="isPendingGetCart"
    :summary-order="dataGetCart?.summary_order"
  />
</template>

<style scoped>
</style>
