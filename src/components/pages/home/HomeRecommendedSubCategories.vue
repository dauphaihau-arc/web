<script setup lang="ts">
import type { Category } from '~/types/category'
import { useGetCategories } from '~/services/category'
import { ROUTES } from '~/config/enums/routes'

const marketStore = useMarketStore()

const params = computed(() => {
  if (marketStore.userActivities?.rootCategoryProductVisited?.id) {
    return {
      parent: marketStore.userActivities?.rootCategoryProductVisited.id,
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
    const toRootCategory = `${ROUTES.C}/${lower(marketStore.userActivities.rootCategoryProductVisited.name)}`
    const toSubCategory = `${toRootCategory}/${lower(subCategory.name)}`

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
    <div v-else-if="dataGetCategories?.categories && dataGetCategories.categories.length > 0">
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
          v-for="cg of dataGetCategories.categories"
          :key="cg.id"
        >
          <div @click="() => redirectPage(cg)">
            <div v-if="cg?.relative_url_image">
              <NuxtImg
                :src="`domainAwsS3/${cg.relative_url_image}`"
                width="100"
                height="100"
                class="cursor-pointer rounded-full"
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
