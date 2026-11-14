<script lang="ts" setup>
import type { UseQueryOptions } from '@tanstack/vue-query'
import ProductSection from '~/domains/product/ui/product-section.vue'
import { useGetTrendingProducts } from '~/domains/product/queries/products.query'
import type { GetProductRecommendationsResponse } from '~/domains/product/api/contracts/product.contract'

const props = withDefaults(defineProps<{
  queryOptions?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>
  limit?: number
}>(), {
  queryOptions: undefined,
  limit: 10,
})

const { data, isPending } = useGetTrendingProducts(
  computed(() => ({ limit: props.limit })),
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
    priority
  />
</template>
