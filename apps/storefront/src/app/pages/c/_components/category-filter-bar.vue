<script setup lang="ts">
import CategoryFilterSheet from './category-filter-sheet.vue'
import { PRODUCT_SORT_OPTIONS } from '~/domains/product/ui/filters/product-sort'
import { useCategoryFilters } from '~/domains/product/ui/filters/use-category-filters'
import { useProductFacets } from '~/domains/product/ui/filters/use-product-facets'
import { countActiveFilters } from '~/domains/product/ui/filters/use-product-filter-state'

const props = defineProps<{
  categoryId?: string
  featuredFacetKeys?: string[]
}>()

const { state, sortOrder } = useCategoryFilters()

const { facets } = useProductFacets({
  categoryId: () => props.categoryId,
  selections: () => state.attributeFilters,
  featuredFacetKeys: () => props.featuredFacetKeys,
})

const activePanel = ref<string | null>(null)

const activeFilterCount = computed(() => countActiveFilters(state))

const sortLabel = computed(() =>
  PRODUCT_SORT_OPTIONS.find(option => option.id === sortOrder.value)?.label ?? '',
)

function facetSelectedCount(facetKey: string) {
  return state.attributeFilters.find(filter => filter.facetKey === facetKey)
    ?.selectedOptionKeys.length ?? 0
}
</script>

<template>
  <div class="scrollbar-hidden -mx-4 flex gap-2 overflow-x-auto px-4 md:-mx-12 md:px-12">
    <UButton
      variant="outline"
      color="gray"
      class="whitespace-nowrap rounded-full text-text-strong"
      :class="activeFilterCount > 0 ? 'ring-text-strong' : 'ring-border-subtle'"
      aria-label="All filters"
      @click="activePanel = 'all'"
    >
      <AppIcon
        name="filter"
        size="xs"
      />
      <span>({{ activeFilterCount }})</span>
    </UButton>

    <UButton
      v-for="facet in facets"
      :key="facet.facetKey"
      variant="outline"
      color="gray"
      class="whitespace-nowrap rounded-full text-text-strong"
      :class="facetSelectedCount(facet.facetKey) > 0 ? 'ring-text-strong' : 'ring-border-subtle'"
      @click="activePanel = `facet:${facet.facetKey}`"
    >
      <span>
        {{ facet.attributeName }}<template v-if="facetSelectedCount(facet.facetKey)"> ({{ facetSelectedCount(facet.facetKey) }})</template>
      </span>
      <AppIcon
        name="chevronDown"
        size="xs"
      />
    </UButton>

    <UButton
      variant="outline"
      color="gray"
      class="whitespace-nowrap rounded-full text-text-strong ring-border-subtle"
      @click="activePanel = 'sort'"
    >
      <span>{{ sortLabel }}</span>
      <AppIcon
        name="chevronDown"
        size="xs"
      />
    </UButton>

    <CategoryFilterSheet
      v-model:panel="activePanel"
      :facets="facets"
    />
  </div>
</template>
