<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { useGetCategories } from '~/domains/category/queries/categories.query'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'
import { buildCategoryPath } from '~/shared/navigation/route-paths'

const props = withDefaults(defineProps<{
  categoryId: string
  /**
   * `vertical` in the desktop sidebar; `horizontal` for the mobile strip that
   * scrolls sideways under the category heading.
   */
  orientation?: 'vertical' | 'horizontal'
}>(), {
  orientation: 'vertical',
})

const marketStore = useMarketStore()
const { blocked, checking, checkForUpdate } = useCategoryIdentityBlocked()

const isHorizontal = computed(() => props.orientation === 'horizontal')

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
    :class="isHorizontal ? 'scrollbar-hidden -mx-4 overflow-x-auto px-4 md:-mx-12 md:px-12' : ''"
  >
    <div
      v-if="isLoadingGetCategories"
      :class="isHorizontal ? 'flex gap-6' : 'space-y-4'"
    >
      <div
        v-for="index in 4"
        :key="index"
      >
        <USkeleton class="h-7 w-32" />
      </div>
    </div>
    <div
      v-else
      :class="isHorizontal ? 'flex gap-6' : 'flex flex-col gap-2'"
    >
      <div
        v-for="cg of dataCategories"
        :key="cg.id"
        :class="isHorizontal ? 'whitespace-nowrap' : ''"
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
</template>
