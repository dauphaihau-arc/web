<script setup lang="ts">
import { consola } from 'consola'
import type { Category } from '~/types/category'
import { useGetCategories } from '~/services/category'

const route = useRoute()
const marketStore = useMarketStore()

const params = computed(() => {
  const category = marketStore.categoriesBreadcrumb.find(c => c.to === route.fullPath)
  if (!category) {
    consola.error('params be undefined')
    return undefined
  }
  return {
    parent: category.id,
  }
})

const {
  isLoading: isLoadingGetCategories,
  data: dataCategories,
} = useGetCategories(params.value)

onMounted(() => {
  if (dataCategories.value) {
    marketStore.userActivities.subCategoriesLastVisit = dataCategories.value.categories.slice(0, 2)
  }
})

const redirectPage = (category: Category) => {
  const to = `${route.fullPath}/${category.name.replaceAll(' ', '-').toLowerCase()}`
  marketStore.categoriesBreadcrumb.push({ ...category, to })
  navigateTo(to)
}
</script>

<template>
  <div class="mb-8 flex gap-3">
    <div
      v-if="isLoadingGetCategories"
      class="space-y-4"
    >
      <div
        v-for="index in 4"
        :key="index"
      >
        <USkeleton class="h-7 w-32" />
      </div>
    </div>
    <div v-else>
      <div class="flex flex-col gap-2">
        <div
          v-for="cg of dataCategories?.categories"
          :key="cg.id"
        >
          <div
            class="cursor-pointer text-base font-medium capitalize"
            @click="() => redirectPage(cg)"
          >
            {{ cg.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
