<script lang="ts" setup>
import ProductSection from './product-section.vue'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'

const marketStore = useMarketStore()
const props = withDefaults(defineProps<{
  products?: GetProductsResponseItem[]
  loading?: boolean
  limit?: number
}>(), {
  products: undefined,
  loading: false,
  limit: 10,
})

const fallbackRecentProducts = computed(() => marketStore.recentProductViews
  .slice(0, props.limit)
  .map(entry => entry.product))

const recentProducts = computed(() => props.products?.length
  ? props.products
  : fallbackRecentProducts.value)
</script>

<template>
  <ProductSection
    title="Recently viewed"
    :products="recentProducts"
    :loading="props.loading && recentProducts.length === 0"
    :limit="props.limit"
  />
</template>

<style scoped>

</style>
