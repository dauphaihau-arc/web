<script lang="ts" setup>
import { useGetProducts } from '~/services/product'

definePageMeta({ layout: 'market' })

const route = useRoute()

if (!route.query?.s) {
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
    title: route.query.s as string,
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

watch(() => route.query.s, () => {
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
        <div v-if="dataGetProducts?.results">
          <div class="mb-6 grid grid-cols-5 gap-3">
            <div
              v-for="product of dataGetProducts.results"
              :key="product.id"
            >
              <ProductCard :product="product" />
            </div>
          </div>
        </div>
        <div
          v-if="dataGetProducts?.total_results && dataGetProducts.total_results > limit"
          class="flex justify-center"
        >
          <UPagination
            v-model="page"
            :page-count="limit"
            size="xl"
            :total="dataGetProducts?.total_results ?? 0"
            :inactive-button="{ color: 'gray' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
