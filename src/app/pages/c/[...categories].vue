<script lang="ts" setup>
import CategoriesBreadcrumb from '~/app/components/c/categories/categories-breadcrumb.vue'
import SubCategories from '~/app/components/c/categories/sub-categories.vue'
import FilterProducts from '~/app/components/filter-products.vue'
import ProductCard from '~/app/components/product-card.vue'
import SortProductsBy from '~/app/components/sort-products-by.vue'
import { useGetProducts } from '~/shared/server-state/product'
import type { GetProductsParams } from '~/shared/types/request-api/product'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()

const limit = 10
const page = ref(1)

const params = computed(() => {
  const category = marketStore.categoriesBreadcrumb.find(c => c.to === route.path)
  if (!category) {
    return undefined
  }
  let defaultParams: GetProductsParams = {
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
    <div class="sticky top-3 z-[2] mb-4 flex items-center justify-between bg-white py-2">
      <CategoriesBreadcrumb :total-products="dataGetProducts?.meta.total || 0" />
      <SortProductsBy />
    </div>

    <div class="flex items-start gap-12">
      <div class="sticky top-28 min-w-[200px] max-w-[200px]">
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
      <div v-else>
        <div
          v-if="dataGetProducts?.items"
          class="mb-16 grid grid-cols-4 gap-x-3 gap-y-8"
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
