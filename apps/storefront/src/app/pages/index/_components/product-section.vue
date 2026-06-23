<script setup lang="ts">
import ProductCard from './product-card.vue'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  products?: GetProductsResponseItem[]
  loading?: boolean
  limit?: number
  gridClass?: string
}>(), {
  description: undefined,
  products: undefined,
  loading: false,
  limit: 10,
  gridClass: 'grid grid-cols-5 gap-4',
})

const hasProducts = computed(() => (props.products?.length ?? 0) > 0)
</script>

<template>
  <div v-if="loading && !hasProducts">
    <div class="mb-3">
      <USkeleton class="mb-1 h-7 w-36" />
      <USkeleton
        v-if="description"
        class="h-5 w-72"
      />
    </div>

    <div :class="gridClass">
      <div
        v-for="index in limit"
        :key="index"
      >
        <USkeleton class="h-[160px] w-[250px] rounded-lg" />
      </div>
    </div>
  </div>

  <div v-else-if="hasProducts">
    <div class="mb-3">
      <h3 class="text-lg font-medium">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="text-md text-text-strong"
      >
        {{ description }}
      </p>
    </div>

    <div :class="gridClass">
      <div
        v-for="product of products"
        :key="product.id"
      >
        <ProductCard :product="product" />
      </div>
    </div>
  </div>
</template>
