<script lang="ts" setup>
import LoadingSvg from '~/shared/components/loading-svg.vue'
import FilterProducts from '~/modules/pages/filter-products.vue'
import ProductCard from '~/modules/pages/product-card.vue'
import SortProductsBy from '~/modules/pages/sort-products-by.vue'
import { useGetProducts } from '~/shared/services/product'

definePageMeta({ layout: 'market' })

const route = useRoute()

if (!route.query?.search) {
  throw showError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true,
  })
}

const limit = 30
const page = ref(1)

const queryParams = computed(() => {
  let defaultParams = {
    page: page.value,
    limit,
    search: route.query.search as string,
  }
  if (route.query) {
    defaultParams = { ...defaultParams, ...route.query }
  }
  return defaultParams
})

const {
  data: dataGetProducts,
  refetch,
  isPending: isPendingGetProducts,
} = useGetProducts(queryParams)

watch(() => route.query.search, () => {
  refetch()
})
</script>

<template>
  <div class="pt-12">
    <div class="mb-4 flex items-center justify-between">
      <div />
      <SortProductsBy />
    </div>
    <div class="flex gap-12">
      <div class="min-w-[200px] max-w-[200px]">
        <FilterProducts />
      </div>

      <div
        v-if="isPendingGetProducts"
        class="grid h-[80vh] w-full place-content-center"
      >
        <LoadingSvg :child-class="'!w-12 !h-12'" />
      </div>
      <div
        v-else
        class="pb-20"
      >
        <div v-if="dataGetProducts?.items">
          <div class="mb-6 grid grid-cols-5 gap-3">
            <div
              v-for="product of dataGetProducts.items"
              :key="product.id"
            >
              <ProductCard :product="product" />
            </div>
          </div>
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
