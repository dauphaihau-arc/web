<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { getRoutePath, routes } from '~/shared/navigation/routes'
import { useGetRootCategories } from '~/domains/category/queries/categories.query'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'

const props = withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>(), {
  orientation: 'horizontal',
})

const emit = defineEmits<{
  select: [category: Category]
}>()

const {
  data: dataRootCategories,
  isPending: isPendingRootCategories,
  isFetching: isFetchingRootCategories,
} = useGetRootCategories()
const marketStore = useMarketStore()
const { blocked } = useCategoryIdentityBlocked()

const isVertical = computed(() => props.orientation === 'vertical')

const listClass = computed(() => (isVertical.value ? 'flex flex-col gap-1' : 'flex gap-3'))
const itemClass = computed(() => (isVertical.value
  ? 'icon-button w-full justify-start capitalize'
  : 'icon-button w-full capitalize'))
const skeletonClass = computed(() => (isVertical.value ? 'w-full' : 'w-20'))

function redirectByCategory(rootCategory: Category) {
  marketStore.userActivities.rootCategoryProductVisited = rootCategory
  emit('select', rootCategory)
  navigateTo(getRoutePath(routes.category(rootCategory.slug, rootCategory.id)))
}
</script>

<template>
  <div v-if="!blocked">
    <div
      v-if="isPendingRootCategories && isFetchingRootCategories"
      :class="listClass"
    >
      <USkeleton
        v-for="index in 7"
        :key="index"
        class="h-7 rounded-md"
        :class="skeletonClass"
      />
    </div>

    <div
      v-else-if="dataRootCategories && dataRootCategories.length > 0"
      :class="listClass"
    >
      <div
        v-for="cg of dataRootCategories"
        :key="cg.id"
      >
        <UButton
          color="gray"
          variant="ghost"
          :class="itemClass"
          @click="redirectByCategory(cg)"
        >
          {{ cg.name }}
        </UButton>
      </div>
    </div>
  </div>
</template>
