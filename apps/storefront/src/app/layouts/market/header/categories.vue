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

// Horizontal: one line, scrolling instead of wrapping labels. A `w-full` chip
// would resolve against an indefinite parent, collapsing the header's `auto`
// grid track to a percentage of itself.
const listClass = computed(() => (isVertical.value
  ? 'flex flex-col gap-1'
  : 'scrollbar-hidden flex items-center gap-3 overflow-x-auto'))

const itemWrapperClass = computed(() => (isVertical.value ? 'w-full' : 'shrink-0'))

const itemClass = computed(() => (isVertical.value
  ? 'icon-button w-full justify-start capitalize'
  : 'icon-button capitalize whitespace-nowrap'))

const skeletonClass = computed(() => (isVertical.value ? 'w-full' : 'w-20'))

/**
 * One row shape for both states: the SSR markup must match the hydrated VDOM,
 * otherwise Vue reuses the server nodes and keeps their skeleton classes, pinning
 * every chip to the placeholder width and wrapping its label.
 */
const items = computed(() => {
  const categories = dataRootCategories.value ?? []
  const isLoading = isPendingRootCategories.value && isFetchingRootCategories.value

  if (isLoading && categories.length === 0) {
    return Array.from({ length: 7 }, (_, index) => ({
      key: `placeholder-${index}`,
      category: undefined,
    }))
  }

  return categories.map(category => ({ key: category.id, category }))
})

function redirectByCategory(rootCategory: Category) {
  marketStore.userActivities.rootCategoryProductVisited = rootCategory
  emit('select', rootCategory)
  navigateTo(getRoutePath(routes.category(rootCategory.slug, rootCategory.id)))
}
</script>

<template>
  <div v-if="!blocked && items.length > 0">
    <div :class="listClass">
      <div
        v-for="item of items"
        :key="item.key"
        :class="itemWrapperClass"
      >
        <USkeleton
          v-if="!item.category"
          class="h-7 rounded-md"
          :class="skeletonClass"
        />
        <UButton
          v-else
          color="gray"
          variant="ghost"
          :class="itemClass"
          @click="redirectByCategory(item.category)"
        >
          {{ item.category.name }}
        </UButton>
      </div>
    </div>
  </div>
</template>
