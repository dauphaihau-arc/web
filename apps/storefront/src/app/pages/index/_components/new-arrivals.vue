<script lang="ts" setup>
import type { UseQueryOptions } from '@tanstack/vue-query'
import ProductSection from './product-section.vue'
import { useGetProducts } from '~/shared/server-state/product/products.query'
import type { GetProductsResponse } from '~/shared/api/product/contracts/product.contract'

const limit = 10
const props = defineProps<{
  queryOptions?: Partial<UseQueryOptions<GetProductsResponse>>
}>()

const { data, isPending } = useGetProducts(computed(() => ({
  limit,
  order: 'newest',
})), props.queryOptions)
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
