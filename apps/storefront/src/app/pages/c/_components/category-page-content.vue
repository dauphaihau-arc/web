<script lang="ts" setup>
import CategoriesBreadcrumb from './categories-breadcrumb.vue'
import CategoryFilterBar from './category-filter-bar.vue'
import ProductResults from './product-results.vue'
import SubCategories from './sub-categories.vue'
import Filters from '~/domains/product/ui/filters/product-filters.vue'
import SortProductsBy from '~/domains/product/ui/sort-products-by.vue'
import { provideCategoryFilters } from '~/domains/product/ui/filters/use-category-filters'
import { usePricePresetOptions } from '~/domains/product/ui/filters/use-price-preset-options'
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

// One filter/sort state for every surface on this page: the desktop sidebar
// panel, the mobile filter bar and sheet, and the sort control all read and
// write it instead of each owning a private copy that fights over the query.
const { currency } = usePricePresetOptions()
provideCategoryFilters(currency)

// The mobile toolbar sticks below the header while it is revealed and flush to
// the viewport top once the header scrolls away.
const headerVisible = useHeaderVisibility()

// The horizontal subcategory strip collapses once the toolbar is pinned, so the
// sticky header keeps only the category name and the filter buttons.
const stickySentinel = ref<HTMLElement | null>(null)
const toolbarPinned = ref(false)

// Past the first few pixels of scroll the toolbar carries its own top padding,
// so the heading is never jammed against the top edge once it sticks.
const { y: scrollY } = useWindowScroll()
const showsToolbarTopPadding = computed(() => scrollY.value > 10)

useIntersectionObserver(stickySentinel, ([entry]) => {
  toolbarPinned.value = !entry?.isIntersecting
})
</script>

<template>
  <div class="lg:pt-12">
    <div
      v-if="!blocked"
      class="sticky top-0 z-[2] mb-4 hidden items-center justify-between py-2 lg:flex"
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

    <template v-else>
      <!-- Mobile and tablet: sidebar-free listing with a sticky filter bar. -->
      <div class="pt-4 lg:hidden">
        <div class="-mx-4 px-4 md:-mx-12 md:px-12">
          <CategoriesBreadcrumb
            :ancestry="ancestry"
            :loading="loading"
            :show-heading="false"
          />
          <div
            ref="stickySentinel"
            class="h-px"
          />
        </div>

        <div
          class="sticky z-[2] -mx-4 mb-4 space-y-2 bg-surface px-4 pb-3 transition-all duration-200 md:-mx-12 md:px-12"
          :class="[headerVisible ? 'top-14' : 'top-0', { 'pt-4': showsToolbarTopPadding }]"
        >
          <CategoriesBreadcrumb
            :ancestry="ancestry"
            :show-breadcrumb="false"
            :name="resolution?.category.name"
            :total-products="total"
            :loading="loading"
          />
          <SubCategories
            :category-id="categoryId"
            orientation="horizontal"
            class="overflow-hidden transition-all duration-200"
            :class="toolbarPinned ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'"
          />
          <CategoryFilterBar
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

      <!-- Desktop: sidebar navigation and filters beside the listing. -->
      <div class="hidden items-start gap-12 lg:flex">
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
    </template>
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
