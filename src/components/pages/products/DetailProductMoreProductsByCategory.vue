<script lang="ts" setup>
import type { Category } from '~/types/category'
import { useGetProducts } from '~/services/product'

const limit = 12

const { categoryId } = defineProps<{
  categoryId: Category['id']
}>()

const queryParams = computed(() => ({
  categoryId,
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
        <DetailProductCard :product="product" />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
