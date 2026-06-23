<script lang="ts" setup>
import ProductSection from './product-section.vue'
import { useGetBestSellerProducts } from '~/shared/server-state/product/products.query'

const limit = 10
const { data, isPending } = useGetBestSellerProducts(computed(() => ({ limit })))
</script>

<template>
  <ProductSection
    title="Best Sellers"
    description="Top products customers are buying the most"
    :products="data?.items"
    :loading="isPending"
    :limit="limit"
  />
</template>
