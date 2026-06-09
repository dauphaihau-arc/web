<script lang="ts" setup>
import type { ProductStates } from '@arc/enums/product'
import type { ListShopProductsRequest } from '~/shared/api/shop/product/contracts/read.contract'
import FilterPopover from '~/app/components/filter/filter-popover.vue'
import FilterToolbar from '~/app/components/filter/filter-toolbar.vue'
import { useGetSuggestCategories } from '~/shared/server-state/category/suggest-categories.mutation'

type ProductCategoryOption = {
  id: string
  label: string
  relatedCategories: string[]
}

const emit = defineEmits<{
  change: [payload: Partial<ListShopProductsRequest>]
  resetPage: []
}>()

const appliedState = defineModel<ProductStates | undefined>('stateFilter')

const { mutateAsync: getCategorySuggestions, isPending: isPendingCategorySuggestions } = useGetSuggestCategories()

const searchDraft = ref('')
const appliedSearch = ref('')
const categoryDraft = ref<ProductCategoryOption | undefined>()
const appliedCategory = ref<ProductCategoryOption | undefined>()
const categoryQuery = ref('')
const openFilter = ref<'search' | 'state' | 'category' | null>(null)

const hasActiveSearchFilter = computed(() => appliedSearch.value.length > 0)
const hasActiveStateFilter = computed(() => !!appliedState.value)
const hasActiveCategoryFilter = computed(() => !!appliedCategory.value)
const hasActiveFilters = computed(() =>
  hasActiveSearchFilter.value
  || hasActiveStateFilter.value
  || hasActiveCategoryFilter.value,
)

const query = computed<Partial<ListShopProductsRequest>>(() => {
  const nextQuery: Partial<ListShopProductsRequest> = {}

  if (appliedSearch.value.trim()) {
    nextQuery.search = appliedSearch.value.trim()
  }

  if (appliedState.value) {
    nextQuery.state = appliedState.value
  }

  if (appliedCategory.value?.id) {
    nextQuery.category_id = appliedCategory.value.id
  }

  return nextQuery
})

watch(query, () => {
  emit('change', query.value)
}, { immediate: true })

async function searchCategories(queryText: string) {
  const normalizedQuery = queryText.trim()

  if (!normalizedQuery) {
    return []
  }

  try {
    const response = await getCategorySuggestions(normalizedQuery)

    return response.categories.map(category => ({
      id: category.id,
      label: category.last_name_category,
      relatedCategories: category.categories_related,
    }))
  }
  catch {
    return []
  }
}

function applySearchFilter() {
  appliedSearch.value = searchDraft.value.trim()
  emit('resetPage')
}

function clearSearchFilter() {
  searchDraft.value = ''
  appliedSearch.value = ''
  emit('resetPage')
}

function applyCategoryFilter() {
  appliedCategory.value = categoryDraft.value
  categoryQuery.value = categoryDraft.value?.label ?? ''
  emit('resetPage')
}

function clearCategoryFilter() {
  categoryDraft.value = undefined
  appliedCategory.value = undefined
  categoryQuery.value = ''
  emit('resetPage')
}

function clearAllFilters() {
  openFilter.value = null
  searchDraft.value = ''
  appliedSearch.value = ''
  appliedState.value = undefined
  categoryDraft.value = undefined
  appliedCategory.value = undefined
  categoryQuery.value = ''
  emit('resetPage')
}

function updateOpenFilter(
  filter: 'search' | 'state' | 'category',
  open: boolean,
) {
  if (open) {
    openFilter.value = filter
    return
  }

  if (openFilter.value === filter) {
    openFilter.value = null
  }
}
</script>

<template>
  <FilterToolbar>
    <FilterPopover
      :open="openFilter === 'search'"
      label="Search"
      :active="hasActiveSearchFilter"
      :value="appliedSearch || undefined"
      :apply-disabled="!searchDraft.trim()"
      @update:open="updateOpenFilter('search', $event)"
      @apply="applySearchFilter"
      @clear="clearSearchFilter"
    >
      <UInput
        v-model="searchDraft"
        placeholder="Search title, slug, or description"
        autofocus
      />
    </FilterPopover>
    <FilterPopover
      :open="openFilter === 'category'"
      label="Category"
      :active="hasActiveCategoryFilter"
      :value="appliedCategory?.label"
      :apply-disabled="!categoryDraft"
      panel-class="w-[min(92vw,300px)]"
      @update:open="updateOpenFilter('category', $event)"
      @apply="applyCategoryFilter"
      @clear="clearCategoryFilter"
    >
      <UInputMenu
        v-model="categoryDraft"
        v-model:query="categoryQuery"
        :search="searchCategories"
        :loading="isPendingCategorySuggestions"
        option-attribute="label"
        :debounce="300"
        by="id"
        placeholder="Search categories"
      >
        <template #option="{ option }">
          <div class="space-y-1 py-1">
            <div class="font-medium text-text-strong">
              {{ option.label }}
            </div>
            <div
              v-if="option.relatedCategories.length > 0"
              class="text-xs text-text-subtle"
            >
              {{ option.relatedCategories.join(' / ') }}
            </div>
          </div>
        </template>
      </UInputMenu>
    </FilterPopover>

    <UButton
      v-if="hasActiveFilters"
      color="gray"
      variant="ghost"
      class="h-8 rounded-full px-3 text-xs font-semibold"
      @click="clearAllFilters"
    >
      Clear filters
    </UButton>
  </FilterToolbar>
</template>
