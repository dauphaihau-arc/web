<script lang="ts" setup>
import type { Shop } from '~/types/shop'
import { useGetProducts } from '~/services/product'

const limit = 6

const { shopId } = defineProps<{
  shopId: Shop['id']
}>()

const queryParams = computed(() => ({
  shop_id: shopId,
  limit,
}))

const { data } = useGetProducts(queryParams)
</script>

<template>
  <div>
    <h3 class="mb-4 text-2xl font-medium">
      More from this shop
    </h3>
    <div
      v-if="data?.results"
      class="mb-6 grid grid-cols-6 gap-4"
    >
      <div
        v-for="(product, i) of data.results"
        :key="i"
      >
        <DetailProductCard :product="product" />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
