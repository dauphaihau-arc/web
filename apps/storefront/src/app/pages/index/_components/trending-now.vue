<script lang="ts" setup>
import ProductSection from './product-section.vue'
import { useGetTrendingProducts } from '~/shared/server-state/product/products.query'

const limit = 10
const { data, isPending } = useGetTrendingProducts(computed(() => ({ limit })))
</script>

<template>
  <ProductSection
    title="Trending Now"
    description="Popular products people are viewing right now"
    :products="data?.items"
    :loading="isPending"
    :limit="limit"
  />
</template>
