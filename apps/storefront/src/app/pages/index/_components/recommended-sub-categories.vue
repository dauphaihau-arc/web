<script setup lang="ts">
import type { Category } from '@arc/models/category'
import CarouselControls from '~/shared/ui/carousel/carousel-controls.vue'
import { circleCategoryCarouselUi } from '~/shared/ui/carousel/carousel-ui'
import { useCarouselControls } from '~/shared/ui/carousel/use-carousel-controls'
import { useGetCategories } from '~/domains/category/queries/categories.query'
import { getRoutePath, routes } from '~/shared/navigation/routes'
import { CATEGORY_IMAGE_VARIANTS, resolveCategoryImageUrl } from '~/domains/category/utils/category-image'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'

const skeletonItems = Array.from({ length: 4 }, (_, index) => index)

const marketStore = useMarketStore()
const config = useRuntimeConfig()
const { blocked } = useCategoryIdentityBlocked()

const categoryImageUrl = (category: Category) => resolveCategoryImageUrl(
  category,
  config.public.assetHost,
  CATEGORY_IMAGE_VARIANTS.RECOMMENDED_1X1,
)

const params = computed(() => {
  if (marketStore.userActivities?.rootCategoryProductVisited?.id) {
    return {
      parent_id: marketStore.userActivities?.rootCategoryProductVisited.id,
    }
  }
  return undefined
})

const {
  data: dataGetCategories,
  error: errorGetCategories,
  isPending: isPendingGetCategories,
  isFetching: isFetchingGetCategories,
} = useGetCategories(params)

watch(errorGetCategories, (value) => {
  const status = value?.statusCode || value?.status || value?.response?.status
  if (status === 404) {
    marketStore.clearCategoryRecommendationState()
  }
})

const subCategories = computed(() => dataGetCategories.value ?? [])
const { carousel, canGoPrev, canGoNext, prev, next } = useCarouselControls(() => subCategories.value.length)

const redirectPage = (subCategory: Category) => {
  navigateTo(getRoutePath(routes.category(subCategory.slug, subCategory.id)))
}
</script>

<template>
  <div v-if="!blocked">
    <div v-if="isFetchingGetCategories && isPendingGetCategories">
      <div class="mx-auto mb-6 max-w-home-layout px-4 md:px-12 lg:px-16">
        <USkeleton class="mb-1 h-7 w-56" />
        <USkeleton class="h-5 w-72" />
      </div>
      <UCarousel
        :items="skeletonItems"
        :ui="circleCategoryCarouselUi"
        class="xl:mx-auto xl:max-w-home-layout xl:px-16"
      >
        <template #default>
          <div class="flex justify-center">
            <USkeleton class="aspect-[1/1] w-full rounded-full" />
          </div>
        </template>
      </UCarousel>
    </div>
    <div v-else-if="subCategories.length > 0">
      <div class="mx-auto mb-6 max-w-home-layout px-4 md:px-12 lg:px-16">
        <h3 class="text-lg font-medium">
          Explore more in this category
        </h3>
        <p class="text-md text-text-strong">
          Jump back into subcategories related to your last browse
        </p>
      </div>
      <div class="relative xl:mx-auto xl:max-w-home-layout xl:px-16">
        <UCarousel
          ref="carousel"
          :items="subCategories"
          :ui="circleCategoryCarouselUi"
        >
          <template #default="{ item: cg }">
            <div class="flex w-full min-w-0 flex-col items-center">
              <NuxtImg
                v-if="categoryImageUrl(cg)"
                :src="categoryImageUrl(cg)"
                class="aspect-[1/1] w-full cursor-pointer rounded-full object-cover"
                @click="() => redirectPage(cg)"
              />
              <div
                class="mt-2 cursor-pointer break-words text-center text-[13px] font-semibold capitalize"
                @click="() => redirectPage(cg)"
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
  </div>
</template>
