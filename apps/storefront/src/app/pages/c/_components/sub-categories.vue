<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { useGetCategories } from '~/domains/category/queries/categories.query'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'
import { buildCategoryPath } from '~/shared/navigation/route-paths'

const props = defineProps<{
  categoryId: string
}>()

const marketStore = useMarketStore()
const { blocked, checking, checkForUpdate } = useCategoryIdentityBlocked()

const params = computed(() => ({ parent_id: props.categoryId }))

const {
  isLoading: isLoadingGetCategories,
  data: dataCategories,
} = useGetCategories(params)

onMounted(() => {
  if (dataCategories.value) {
    marketStore.userActivities.subCategoriesLastVisit = dataCategories.value.slice(0, 2)
  }
})

const redirectPage = (category: Category) => {
  navigateTo(buildCategoryPath(category.slug, category.id))
}
</script>

<template>
  <CategoryIdentityUpdateCard
    v-if="blocked"
    :checking="checking"
    @check="checkForUpdate"
  />

  <div
    v-else-if="isLoadingGetCategories || dataCategories?.length"
    class="flex gap-3"
  >
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
          v-for="cg of dataCategories"
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
