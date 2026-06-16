<script lang="ts" setup>
import ProductCard from '~/app/components/product/product-card.vue'
import { useGetProductRecommendationSections } from '~/shared/server-state/product/products.query'

const limit = 6

const { productSlug, shopSlug } = defineProps<{
  productSlug: string
  shopSlug: string
}>()

const queryParams = computed(() => ({
  productSlug,
  shopSlug,
  limit,
}))

const { data } = useGetProductRecommendationSections(queryParams)
</script>

<template>
  <div
    v-if="data?.sections?.length"
    class="space-y-10"
  >
    <section
      v-for="section of data.sections"
      :key="section.type"
    >
      <h3 class="mb-4 text-2xl font-medium">
        {{ section.title }}
      </h3>
      <div class="mb-6 grid grid-cols-6 gap-4">
        <div
          v-for="(product, i) of section.items"
          :key="`${section.type}-${i}`"
        >
          <ProductCard :product="product" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>

</style>
