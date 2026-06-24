<script lang="ts" setup>
import type { UseQueryOptions } from '@tanstack/vue-query'
import ProductSection from './product-section.vue'
import { useGetTrendingProducts } from '~/shared/server-state/product/products.query'
import type { GetProductRecommendationsResponse } from '~/shared/api/product/contracts/product.contract'

const limit = 10
const props = defineProps<{
  queryOptions?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>
}>()

const { data, isPending } = useGetTrendingProducts(
  computed(() => ({ limit })),
  props.queryOptions,
)
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
