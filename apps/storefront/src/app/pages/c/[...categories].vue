<script lang="ts" setup>
import CategoriesBreadcrumb from './_components/categories-breadcrumb.vue'
import ProductResults from './_components/product-results.vue'
import SubCategories from './_components/sub-categories.vue'
import Filters from '~/app/components/product/filters/filters.vue'
import SortProductsBy from '~/app/components/product/sort-products-by.vue'
import { useGetProducts } from '~/shared/server-state/product/products.query'
import type { GetProductsRequest } from '~/shared/api/product/contracts/product.contract'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()

const limit = 16
const page = ref(1)

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

const params = computed(() => {
  const category = marketStore.categoriesBreadcrumb.find(c => c.to === route.path)
  if (!category) {
    return undefined
  }
  let defaultParams: GetProductsRequest = {
    category_id: category.id,
    page: page.value,
    limit,
  }
  if (route.query) {
    defaultParams = { ...defaultParams, ...normalizeRouteQuery(route.query) }
  }
  return defaultParams
})

const {
  data: dataGetProducts,
  isPending: isPendingGetProducts,
} = useGetProducts(params)

watch(() => page.value, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}, { immediate: true })
</script>

<template>
  <div class="pt-12">
    <div class="sticky top-0 z-[2] mb-4 flex items-center justify-between py-2">
      <div class="surface-backdrop categories-toolbar-backdrop" />
      <CategoriesBreadcrumb :total-products="dataGetProducts?.meta.total || 0" />
      <SortProductsBy />
    </div>

    <div class="flex items-start gap-12">
      <div class="sticky top-16 flex max-h-[calc(100vh-4rem)] min-w-[200px] max-w-[200px] flex-col overflow-y-auto pb-8 space-y-4 pr-2">
        <SubCategories />
        <UDivider />
        <Filters :category-id="params?.category_id" />
      </div>

      <ProductResults
        v-model:page="page"
        :items="dataGetProducts?.items"
        :total="dataGetProducts?.meta.total"
        :limit="limit"
        :loading="isPendingGetProducts"
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
