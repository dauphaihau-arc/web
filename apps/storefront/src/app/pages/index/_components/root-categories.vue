<script setup lang="ts">
import type { Category } from '@arc/models/category'
import CarouselControls from '~/shared/ui/carousel/carousel-controls.vue'
import { categoryCarouselUi } from '~/shared/ui/carousel/carousel-ui'
import { useCarouselControls } from '~/shared/ui/carousel/use-carousel-controls'
import { getRoutePath, routes } from '~/shared/navigation/routes'
import { useGetRootCategories } from '~/domains/category/queries/categories.query'
import { CATEGORY_IMAGE_VARIANTS, CATEGORY_IMAGE_VARIANT_SIZES, resolveCategoryImageUrl } from '~/domains/category/utils/category-image'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'

const { data } = useGetRootCategories()
const marketStore = useMarketStore()
const { blocked, checking, checkForUpdate } = useCategoryIdentityBlocked()

const categories = computed(() => data.value ?? [])
const { carousel, canGoPrev, canGoNext, prev, next } = useCarouselControls(() => categories.value.length)

const categoryImageUrl = (category: Category) => resolveCategoryImageUrl(
  category,
  CATEGORY_IMAGE_VARIANTS.ROOT_2X3,
)

const redirectByCategory = (category: Category) => {
  marketStore.userActivities.rootCategoryProductVisited = category
  navigateTo(getRoutePath(routes.category(category.slug, category.id)))
}
</script>

<template>
  <div
    v-if="blocked"
    class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16"
  >
    <CategoryIdentityUpdateCard
      :checking="checking"
      @check="checkForUpdate"
    />
  </div>

  <div v-else-if="categories.length > 0">
    <div class="mx-auto mb-3 max-w-home-layout px-4 md:px-12 lg:px-16">
      <h3 class="break-words text-lg font-medium">
        Shop by category
      </h3>
    </div>
    <div class="relative xl:mx-auto xl:max-w-home-layout xl:px-16">
      <UCarousel
        ref="carousel"
        :items="categories"
        :ui="categoryCarouselUi"
      >
        <template #default="{ item: cg }">
          <div class="flex w-full min-w-0 flex-col">
            <NuxtImg
              v-if="categoryImageUrl(cg)"
              :src="categoryImageUrl(cg)"
              densities="1"
              v-bind="CATEGORY_IMAGE_VARIANT_SIZES[CATEGORY_IMAGE_VARIANTS.ROOT_2X3]"
              loading="lazy"
              class="aspect-[2/3] w-full cursor-pointer rounded object-cover"
              @click="() => redirectByCategory(cg)"
            />
            <div
              class="mt-2 cursor-pointer break-words text-center text-[13px] font-semibold capitalize"
              @click="() => redirectByCategory(cg)"
            >
              {{ cg.name }}
            </div>
          </div>
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
