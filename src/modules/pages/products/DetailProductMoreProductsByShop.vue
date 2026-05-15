<script lang="ts" setup>
import type { Shop } from '~/shared/types/shop'
import { useGetProducts } from '~/shared/services/product'

const limit = 6

const { shopId } = defineProps<{
  shopId: Shop['id']
}>()

const queryParams = computed(() => ({
  shopId,
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
