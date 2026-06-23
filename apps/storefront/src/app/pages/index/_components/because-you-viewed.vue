<script lang="ts" setup>
import ProductCard from './product-card.vue'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { useGetProductRecommendations } from '~/shared/server-state/product/products.query'

const limit = 8
const props = defineProps<{
  anchorProduct?: GetProductsResponseItem
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

const { data } = useGetProductRecommendations(queryParams)
</script>

<template>
  <div v-if="anchorProduct && data?.items?.length">
    <div class="mb-3">
      <h3 class="text-lg font-medium">
        Because you viewed
      </h3>
      <p class="text-md text-text-strong">
        {{ anchorProduct.title }}
      </p>
    </div>
    <div class="grid grid-cols-6 gap-4">
      <div
        v-for="(product, i) of data.items"
        :key="i"
      >
        <ProductCard :product="product" />
      </div>
    </div>
  </div>
</template>
