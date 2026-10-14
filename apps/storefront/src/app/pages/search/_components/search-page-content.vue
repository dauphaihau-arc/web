<script lang="ts" setup>
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import Filters from '~/domains/product/ui/filters/product-filters.vue'
import ProductListingFilterBar from '~/domains/product/ui/filters/product-listing-filter-bar.vue'
import ProductResults from '~/domains/product/ui/product-results.vue'
import SortProductsBy from '~/domains/product/ui/sort-products-by.vue'
import type { ProductFacetScope } from '~/domains/product/ui/filters/product-filter-query'
import { provideProductListingFilters } from '~/domains/product/ui/filters/use-product-listing-filters'
import { usePricePresetOptions } from '~/domains/product/ui/filters/use-price-preset-options'
import { useSearchProducts } from '../_composables/use-search-products'

const route = useRoute()

const searchQuery = computed(() => String(route.query.q ?? '').trim())

// This listing's facets describe the keyword, not a category node.
const facetScope = computed<ProductFacetScope>(() => ({ search: searchQuery.value }))

const {
  page,
  limit,
  items,
  total,
  loading,
  error,
} = useSearchProducts(searchQuery)

const resultSummary = computed(() => {
  if ((total.value ?? 0) === 1) {
    return '1 result'
  }

  return `${total.value ?? 0} results`
})

const emptyTitle = computed(() => `No results for "${searchQuery.value}"`)

// One filter/sort state for every surface on this page: the desktop sidebar
// panel, the mobile filter bar and sheet, and the sort control all read and
// write it instead of each owning a private copy that fights over the query.
const { currency } = usePricePresetOptions()
provideProductListingFilters(currency)

// The mobile toolbar sticks below the header while it is revealed and flush to
// the viewport top once the header scrolls away.
const headerVisible = useHeaderVisibility()

// Past the first few pixels of scroll the toolbar carries its own top padding,
// so the heading is never jammed against the top edge once it sticks.
const { y: scrollY } = useWindowScroll()
const showsToolbarTopPadding = computed(() => scrollY.value > 10)
</script>

<template>
  <div class="lg:pt-12">
    <!-- Mobile and tablet: sidebar-free listing with a sticky filter toolbar. -->
    <div class="pt-4 lg:hidden">
      <div
        class="sticky z-[2] -mx-4 mb-4 space-y-2 bg-surface px-4 pb-3 transition-all duration-200 md:-mx-12 md:px-12"
        :class="[headerVisible ? 'top-14' : 'top-0', { 'pt-4': showsToolbarTopPadding }]"
      >
        <div>
          <h1 class="text-lg font-semibold text-text-strong">
            Search Results
          </h1>
          <p class="text-sm text-text-subtle">
            {{ resultSummary }} for "{{ searchQuery }}"
          </p>
        </div>
        <ProductListingFilterBar :scope="facetScope" />
      </div>

      <ProductResults
        v-model:page="page"
        :items="items"
        :total="total"
        :limit="limit"
        :loading="loading"
        :error="error"
      >
        <template #empty>
          <Empty
            size="2xl"
            variant="naked"
            class="mb-16 min-h-[320px]"
            heading-class="font-semibold"
            :icon="ICON_NAME_BY_ALIAS.search"
            :title="emptyTitle"
            description="Try a more specific product name, fewer words, or a different keyword."
          />
        </template>
      </ProductResults>
    </div>

    <!-- Desktop: sidebar filters beside the listing. -->
    <div class="hidden lg:block">
      <div class="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 class="text-2xl font-semibold text-text-strong">
            Search Results
          </h1>
          <p class="mt-1 text-sm text-text-subtle">
            {{ resultSummary }} for "{{ searchQuery }}"
          </p>
        </div>
        <SortProductsBy />
      </div>

      <div class="flex items-start gap-12">
        <div class="scrollbar-subtle sticky top-16 flex max-h-[calc(100vh-4rem)] min-w-[200px] max-w-[200px] flex-col space-y-4 overflow-y-auto pb-8 pr-2">
          <Filters :search="searchQuery" />
        </div>

        <ProductResults
          v-model:page="page"
          :items="items"
          :total="total"
          :limit="limit"
          :loading="loading"
          :error="error"
        >
          <template #empty>
            <Empty
              size="2xl"
              variant="naked"
              class="mb-16 min-h-[320px]"
              heading-class="font-semibold"
              :icon="ICON_NAME_BY_ALIAS.search"
              :title="emptyTitle"
              description="Try a more specific product name, fewer words, or a different keyword."
            />
          </template>
        </ProductResults>
      </div>
    </div>
  </div>
</template>
