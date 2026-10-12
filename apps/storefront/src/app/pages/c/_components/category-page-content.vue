<script lang="ts" setup>
import CategoriesBreadcrumb from './categories-breadcrumb.vue'
import ProductResults from './product-results.vue'
import SubCategories from './sub-categories.vue'
import Filters from '~/domains/product/ui/filters/product-filters.vue'
import SortProductsBy from '~/domains/product/ui/sort-products-by.vue'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'
import type { CategoryResolution } from '~/domains/category/utils/category.normalizer'
import { useCategoryProducts } from '../_composables/use-category-products'

const props = defineProps<{
  resolution?: CategoryResolution
}>()

const { blocked, checking, checkForUpdate } = useCategoryIdentityBlocked()

// Identity comes only from the authoritative resolution: there is no raw URL
// fallback, so products and facets never describe an unresolved category.
const categoryId = computed(() => props.resolution?.category.id ?? '')
const ancestry = computed(() => props.resolution?.ancestry ?? [])

const {
  page,
  limit,
  items,
  total,
  loading,
  error,
  hasActiveFilters,
} = useCategoryProducts(() => props.resolution?.category.id)
</script>

<template>
  <div class="pt-12">
    <div
      v-if="!blocked"
      class="sticky top-0 z-[2] mb-4 flex items-center justify-between py-2"
    >
      <div class="surface-backdrop categories-toolbar-backdrop" />
      <CategoriesBreadcrumb
        :ancestry="ancestry"
        :name="resolution?.category.name"
        :total-products="total"
        :loading="loading"
      />
      <SortProductsBy />
    </div>

    <CategoryIdentityUpdateCard
      v-if="blocked"
      class="mt-4"
      :checking="checking"
      @check="checkForUpdate"
    />

    <div
      v-else
      class="flex items-start gap-12"
    >
      <div class="scrollbar-subtle sticky top-16 flex max-h-[calc(100vh-4rem)] min-w-[200px] max-w-[200px] flex-col space-y-4 overflow-y-auto pb-8 pr-2">
        <SubCategories :category-id="categoryId" />
        <UDivider />
        <Filters
          :category-id="categoryId"
          :featured-facet-keys="resolution?.category.featuredFacetKeys"
        />
      </div>

      <ProductResults
        v-model:page="page"
        :items="items"
        :total="total"
        :limit="limit"
        :loading="loading"
        :error="error"
        :has-active-filters="hasActiveFilters"
      />
    </div>
  </div>
</template>

<style scoped>
.categories-toolbar-backdrop {
  backdrop-filter: blur(2px);
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.99) 35%, var(--surface-overlay) 18%, transparent 100%);
}

:global(.dark) .categories-toolbar-backdrop {
  background: linear-gradient(to bottom, rgb(0 0 0 / 0.82) 0%, var(--surface-overlay-dark) 48%, transparent 100%);
}
</style>
