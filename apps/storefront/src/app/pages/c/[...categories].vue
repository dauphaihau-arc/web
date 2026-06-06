<script lang="ts" setup>
import CategoriesBreadcrumb from './_components/categories-breadcrumb.vue'
import SubCategories from './_components/sub-categories.vue'
import FilterProducts from '~/app/components/product/filter-products.vue'
import ProductCard from '~/app/components/product/product-card.vue'
import SortProductsBy from '~/app/components/product/sort-products-by.vue'
import { useGetProducts } from '~/shared/server-state/product/products.query'
import type { GetProductsRequest } from '~/shared/api/product/contracts/product.contract'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()

const limit = 16
const page = ref(1)

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
    defaultParams = { ...defaultParams, ...route.query }
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
      <div class="sticky top-16 min-w-[200px] max-w-[200px]">
        <SubCategories />
        <FilterProducts />
      </div>

      <div v-if="isPendingGetProducts">
        <div class="mb-16 grid grid-cols-4 gap-x-3 gap-y-8">
          <div
            v-for="i in limit"
            :key="i"
          >
            <div>
              <USkeleton class="size-[254px]" />
              <div class="mt-3 space-y-3">
                <USkeleton class="h-5 w-[190px] " />
                <USkeleton class="h-5 w-[150px] " />
                <USkeleton class="h-5 w-[120px] " />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="w-full"
      >
        <div
          v-if="dataGetProducts?.items"
          class="mb-16 grid grid-cols-4 gap-8"
        >
          <div
            v-for="product of dataGetProducts.items"
            :key="product.id"
          >
            <ProductCard :product="product" />
          </div>
        </div>
        <div
          v-if="dataGetProducts?.meta.total && dataGetProducts.meta.total > limit"
          class="flex justify-center"
        >
          <UPagination
            v-model="page"
            size="xl"
            :page-count="limit"
            :total="dataGetProducts?.meta.total ?? 0"
            :inactive-button="{ color: 'gray' }"
          />
        </div>
      </div>
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
