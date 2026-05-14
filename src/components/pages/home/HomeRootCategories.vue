<script setup lang="ts">
import type { Category } from '~/types/category'
import { ROUTES } from '~/config/enums/routes'
import { useGetRootCategories } from '~/services/category'

const { data } = useGetRootCategories()
const marketStore = useMarketStore()

const redirectByCategory = (category: Category) => {
  const to = `${ROUTES.C}/${category.name.replaceAll(' ', '-').toLowerCase()}`
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
            v-if="cg?.imageUrl"
            :src="cg.imageUrl"
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
