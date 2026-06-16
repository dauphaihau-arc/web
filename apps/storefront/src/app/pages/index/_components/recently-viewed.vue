<script lang="ts" setup>
import ProductCard from './product-card.vue'
import { useGetRecentlyViewedProducts } from '~/shared/server-state/product/products.query'

const limit = 10
const marketStore = useMarketStore()
const fallbackRecentProducts = computed(() => marketStore.recentProductViews
  .slice(0, limit)
  .map(entry => entry.product))
const { data } = useGetRecentlyViewedProducts(computed(() => ({ limit })))
const recentProducts = computed(() => data.value?.items?.length
  ? data.value.items
  : fallbackRecentProducts.value)
</script>

<template>
  <div v-if="recentProducts.length > 0">
    <div>
      <h3 class="mb-3 text-lg font-medium">
        Recently viewed
      </h3>
      <div class="grid grid-cols-5 gap-4">
        <div
          v-for="(product, i) of recentProducts"
          :key="i"
        >
          <ProductCard :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
