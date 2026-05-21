<script lang="ts" setup>
import ProductCard from '~/app/components/detail-product/product-card.vue'
import type { Category } from '~/shared/api/category/categories'
import { useGetProducts } from '~/shared/server-state/product/products.query'

const limit = 12

const { category_id } = defineProps<{
  category_id: Category['id']
}>()

const queryParams = computed(() => ({
  category_id,
  limit,
}))

const { data } = useGetProducts(queryParams)
</script>

<template>
  <div>
    <h3 class="mb-4 text-2xl font-medium">
      You may also like
    </h3>
    <div
      v-if="data?.items"
      class="mb-6 grid grid-cols-6 gap-4"
    >
      <div
        v-for="(product, i) of data.items"
        :key="i"
      >
        <ProductCard :product="product" />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
