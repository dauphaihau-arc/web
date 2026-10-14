<script setup lang="ts">
import type { UseQueryOptions } from '@tanstack/vue-query'
import ProductSection from '~/domains/product/ui/product-section.vue'
import type { GetProductsResponseItem, GetProductRecommendationsResponse } from '~/domains/product/api/contracts/product.contract'
import { useGetProductRecommendations } from '~/domains/product/queries/products.query'

const limit = 8
const props = defineProps<{
  anchorProduct?: GetProductsResponseItem
  queryOptions?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>
}>()

const anchorProduct = computed(() => props.anchorProduct)
const queryParams = computed(() => {
  if (!anchorProduct.value?.shop?.slug || !anchorProduct.value?.slug) {
    return undefined
  }

  return {
    shopSlug: anchorProduct.value.shop.slug,
    productSlug: anchorProduct.value.slug,
    limit,
  }
})

const { data } = useGetProductRecommendations(queryParams, props.queryOptions)

const recommendedProducts = computed(() => data.value?.items ?? [])
</script>

<template>
  <ProductSection
    v-if="anchorProduct && recommendedProducts.length > 0"
    title="Because you viewed"
    :description="anchorProduct.title"
    :products="recommendedProducts"
    :limit="limit"
  />
</template>
