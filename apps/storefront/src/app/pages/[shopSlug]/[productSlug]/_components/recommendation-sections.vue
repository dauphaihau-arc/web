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

const { data, isPending } = useGetProductRecommendationSections(queryParams)
</script>

<template>
  <div
    v-if="isPending"
    class="space-y-10"
    aria-busy="true"
    aria-live="polite"
  >
    <section>
      <div class="mb-4 flex items-center justify-between">
        <USkeleton class="h-8 w-64 !bg-customGray-300/85" />
        <USkeleton class="h-8 w-28 !bg-customGray-300/85" />
      </div>
      <div class="mb-6 grid grid-cols-6 gap-4">
        <div
          v-for="index in limit"
          :key="index"
        >
          <USkeleton class="aspect-[254/320] w-full rounded-[28px] !bg-customGray-300/85" />
          <div class="mt-3 space-y-3">
            <USkeleton class="h-5 w-[190px] !bg-customGray-300/85" />
            <USkeleton class="h-5 w-[150px] !bg-customGray-300/85" />
            <USkeleton class="h-5 w-[120px] !bg-customGray-300/85" />
          </div>
        </div>
      </div>
    </section>
  </div>

  <div
    v-else-if="data?.sections?.length"
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
          <ProductCard
            :product="product"
            :show-sale-percent="false"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>

</style>
