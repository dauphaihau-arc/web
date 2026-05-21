<script setup lang="ts">
import type { Category } from '~/shared/api/category/category'
import { useGetCategories } from '~/shared/server-state/category/categories.query'
import { getRoutePath, routes } from '~/shared/navigation/routes'

const marketStore = useMarketStore()

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
} = useGetCategories(params.value)

watch(errorGetCategories, (value) => {
  const status = value?.statusCode || value?.status || value?.response?.status
  if (status === 404) {
    marketStore.clearCategoryRecommendationState()
  }
})

const redirectPage = (subCategory: Category) => {
  if (marketStore.categoriesBreadcrumb && marketStore.userActivities?.rootCategoryProductVisited?.name) {
    const lower = (str: string) => str.replaceAll(' ', '-').toLowerCase()
    const rootCategorySlug = lower(marketStore.userActivities.rootCategoryProductVisited.name)
    const toRootCategory = getRoutePath(routes.category(rootCategorySlug))
    const toSubCategory = getRoutePath(routes.category([rootCategorySlug, lower(subCategory.name)]))

    marketStore.categoriesBreadcrumb = [
      {
        ...marketStore.userActivities?.rootCategoryProductVisited,
        to: toRootCategory,
      },
      {
        ...subCategory,
        to: toSubCategory,
      },
    ]
    navigateTo(toSubCategory)
  }
}
</script>

<template>
  <div>
    <div
      v-if="isFetchingGetCategories && isPendingGetCategories"
      class="flex gap-16"
    >
      <div
        v-for="index in 4"
        :key="index"
      >
        <USkeleton
          class="size-28"
          :ui="{ rounded: 'rounded-full' }"
        />
      </div>
    </div>
    <div v-else-if="dataGetCategories && dataGetCategories.length > 0">
      <div class="mb-6">
        <h3 class="text-lg font-medium">
          Recommended categories for you
        </h3>
        <p class="text-md text-customGray-900">
          Based on your activity
        </p>
      </div>
      <div class="flex gap-16">
        <div
          v-for="cg of dataGetCategories"
          :key="cg.id"
        >
          <div @click="() => redirectPage(cg)">
            <div v-if="cg?.imageUrl">
              <NuxtImg
                :src="cg.imageUrl"
                width="100"
                height="100"
                class="size-[100px] cursor-pointer rounded-full object-cover"
              />
            </div>
            <div
              class="mt-2 cursor-pointer text-center text-[13px] font-semibold capitalize"
            >
              {{ cg.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
