<script lang="ts" setup>
import ProductSection from './product-section.vue'
import { useGetProducts } from '~/shared/server-state/product/products.query'

const limit = 10
const { data, isPending } = useGetProducts(computed(() => ({
  limit,
  order: 'newest',
})))
</script>

<template>
  <ProductSection
    title="New Arrivals"
    description="Fresh listings recently added to the marketplace"
    :products="data?.items"
    :loading="isPending"
    :limit="limit"
  />
</template>
