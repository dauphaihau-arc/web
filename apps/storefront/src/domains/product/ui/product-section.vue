<script setup lang="ts">
import ProductCard from './product-card-compact.vue'
import CarouselControls from '~/shared/ui/carousel/carousel-controls.vue'
import { productCarouselUi } from '~/shared/ui/carousel/carousel-ui'
import { useCarouselControls } from '~/shared/ui/carousel/use-carousel-controls'
import type { GetProductsResponseItem } from '~/domains/product/api/contracts/product.contract'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  products?: GetProductsResponseItem[]
  loading?: boolean
  limit?: number
}>(), {
  description: undefined,
  products: undefined,
  loading: false,
  limit: 10,
})

const productItems = computed(() => props.products ?? [])
const hasProducts = computed(() => productItems.value.length > 0)
const skeletonItems = computed(() => Array.from({ length: props.limit }, (_, index) => index))
const { carousel, canGoPrev, canGoNext, prev, next } = useCarouselControls(() => productItems.value.length)
</script>

<template>
  <div v-if="loading && !hasProducts">
    <div class="mx-auto mb-3 max-w-home-layout px-4 md:px-12 lg:px-16">
      <USkeleton class="mb-1 h-7 w-36" />
      <USkeleton
        v-if="description"
        class="h-5 w-72"
      />
    </div>

    <UCarousel
      :items="skeletonItems"
      :ui="productCarouselUi"
      class="xl:mx-auto xl:max-w-home-layout xl:px-16"
    >
      <template #default>
        <USkeleton class="aspect-[1/1] w-full rounded-lg" />
      </template>
    </UCarousel>
  </div>

  <div v-else-if="hasProducts">
    <div class="mx-auto mb-3 max-w-home-layout px-4 md:px-12 lg:px-16">
      <h3 class="break-words text-lg font-medium">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="text-md break-words text-text-strong"
      >
        {{ description }}
      </p>
    </div>

    <div class="relative xl:mx-auto xl:max-w-home-layout xl:px-16">
      <UCarousel
        ref="carousel"
        :items="productItems"
        :ui="productCarouselUi"
      >
        <template #default="{ item }">
          <ProductCard :product="item" />
        </template>
      </UCarousel>
      <CarouselControls
        :can-prev="canGoPrev"
        :can-next="canGoNext"
        @prev="prev"
        @next="next"
      />
    </div>
  </div>
</template>
