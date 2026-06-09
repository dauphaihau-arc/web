<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { getRoutePath, routes } from '~/shared/navigation/routes'
import { useGetRootCategories } from '~/shared/server-state/category/categories.query'
import { CATEGORY_IMAGE_VARIANTS, resolveCategoryImageUrl } from '~/shared/utils/category-image'

const { data } = useGetRootCategories()
const marketStore = useMarketStore()
const config = useRuntimeConfig()

const categoryImageUrl = (category: Category) => resolveCategoryImageUrl(
  category,
  config.public.assetHost,
  CATEGORY_IMAGE_VARIANTS.ROOT_2X3,
)

const redirectByCategory = (category: Category) => {
  const to = getRoutePath(routes.category(category.name.replaceAll(' ', '-').toLowerCase()))
  marketStore.categoriesBreadcrumb = [{ ...category, to }]
  marketStore.userActivities.rootCategoryProductVisited = category
  navigateTo(to)
}
</script>

<template>
  <div v-if="data && data.length > 0">
    <h3 class="mb-6 text-center text-3xl font-normal">
      Shop by category
    </h3>
    <div class="flex justify-center gap-8">
      <div
        v-for="(cg, index) of data"
        :key="index"
      >
        <div @click="() => redirectByCategory(cg)">
          <NuxtImg
            v-if="categoryImageUrl(cg)"
            :src="categoryImageUrl(cg)"
            class="h-[210px] w-[140px] cursor-pointer rounded object-cover"
          />
          <div
            class="mt-2 cursor-pointer text-center text-[13px] font-semibold capitalize"
          >
            {{ cg.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
