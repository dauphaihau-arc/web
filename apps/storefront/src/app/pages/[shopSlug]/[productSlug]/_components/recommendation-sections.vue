<script lang="ts" setup>
import ProductSection from '~/domains/product/ui/product-section.vue'
import { useGetProductRecommendationSections } from '~/domains/product/queries/products.query'

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

const { data, isPending } = useGetProductRecommendationSections(queryParams)
</script>

<template>
  <div class="space-y-10">
    <ProductSection
      v-if="isPending"
      title=""
      loading
      :limit="limit"
    />

    <ProductSection
      v-for="section of data?.sections ?? []"
      :key="section.type"
      :title="section.title"
      :products="section.items"
      :limit="limit"
    />
  </div>
</template>
