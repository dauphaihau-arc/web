<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import Filters from '~/app/components/product/filters/filters.vue'
import ProductCard from '~/app/components/product/product-card.vue'
import SortProductsBy from '~/app/components/product/sort-products-by.vue'
import { useGetProducts } from '~/shared/server-state/product/products.query'

definePageMeta({ layout: 'market' })

const route = useRoute()

function normalizeRouteQuery(query: typeof route.query): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {}

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      normalized[key] = value
      return
    }

    if (Array.isArray(value)) {
      const entries = value.filter((entry): entry is string => typeof entry === 'string')

      if (entries.length > 0) {
        normalized[key] = entries
      }
    }
  })

  return normalized
}

if (!route.query?.search) {
  throw showError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true,
  })
}

const limit = 30
const page = ref(1)
const searchQuery = computed(() => (route.query.search as string).trim())
const products = computed(() => dataGetProducts.value?.items ?? [])
const totalResults = computed(() => dataGetProducts.value?.meta.total ?? 0)
const hasResults = computed(() => products.value.length > 0)

const resultSummary = computed(() => {
  if (totalResults.value === 1) {
    return '1 result'
  }

  return `${totalResults.value} results`
})

const queryParams = computed(() => {
  let defaultParams = {
    page: page.value,
    limit,
    search: searchQuery.value,
  }
  if (route.query) {
    defaultParams = { ...defaultParams, ...normalizeRouteQuery(route.query) }
  }
  return defaultParams
})

const {
  data: dataGetProducts,
  refetch,
  isPending: isPendingGetProducts,
} = useGetProducts(queryParams)

watch(() => route.query.search, () => {
  page.value = 1
  refetch()
})
</script>

<template>
  <div class="pt-12">
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
    <div class="flex gap-12">
      <div class="min-w-[200px] max-w-[200px]">
        <Filters />
      </div>

      <div
        v-if="isPendingGetProducts"
        class="grid h-[80vh] w-full place-content-center"
      >
        <LoadingSvg :child-class="'!w-12 !h-12'" />
      </div>
      <div
        v-else
        class="w-full pb-20"
      >
        <div v-if="hasResults">
          <div class="mb-6 grid grid-cols-5 gap-3">
            <div
              v-for="product of products"
              :key="product.id"
            >
              <ProductCard :product="product" />
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-surface-muted px-6 text-center"
        >
          <h2 class="text-xl font-semibold text-text-strong">
            No results for "{{ searchQuery }}"
          </h2>
          <p class="mt-2 max-w-md text-sm text-text-subtle">
            Try a more specific product name, fewer words, or a different keyword.
          </p>
        </div>
        <div
          v-if="dataGetProducts?.meta.total && dataGetProducts.meta.total > limit"
          class="flex justify-center"
        >
          <UPagination
            v-model="page"
            :page-count="limit"
            size="xl"
            :total="dataGetProducts?.meta.total ?? 0"
            :inactive-button="{ color: 'gray' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
