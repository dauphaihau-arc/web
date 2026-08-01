<script lang="ts" setup>
import type { UseQueryOptions } from '@tanstack/vue-query'
import ProductSection from './product-section.vue'
import { useGetProducts } from '~/domains/product/queries/products.query'
import type { GetProductsResponse } from '~/domains/product/api/contracts/product.contract'

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
