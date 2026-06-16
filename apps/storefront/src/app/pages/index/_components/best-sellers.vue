<script lang="ts" setup>
import ProductCard from './product-card.vue'
import { useGetBestSellerProducts } from '~/shared/server-state/product/products.query'

const limit = 10
const { data } = useGetBestSellerProducts(computed(() => ({ limit })))
</script>

<template>
  <div v-if="data?.items?.length">
    <div>
      <h3 class="mb-1 text-lg font-medium">
        Best Sellers
      </h3>
      <p class="mb-3 text-md text-text-strong">
        Top products customers are buying the most
      </p>
      <div class="grid grid-cols-5 gap-4">
        <div
          v-for="(product, i) of data.items"
          :key="i"
        >
          <ProductCard :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>
