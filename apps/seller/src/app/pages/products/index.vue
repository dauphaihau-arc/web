<script lang="ts" setup>
import { ProductStates } from '@arc/enums/product'
import ProductsFilterToolbar from './_components/products-filter-toolbar.vue'
import ProductsStateTabs from './_components/products-state-tabs.vue'
import ProductsTable from './_components/products-table.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import type {
  ListShopProductsRequest,
} from '~/shared/api/shop/product/contracts/read.contract'
import { useShopGetProducts } from '~/shared/server-state/shop/product/list.query'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const pageCount = 20
const page = ref(1)
const activeFilters = ref<Partial<ListShopProductsRequest>>({})
const stateFilter = ref<ProductStates | undefined>()

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
  ...activeFilters.value,
}))

const productCountBaseParams = computed<ListShopProductsRequest>(() => ({
  ...activeFilters.value,
  page: 1,
  limit: 1,
  state: undefined,
}))

const {
  isPending: isPendingShopGetProducts,
  data: dataShopGetProducts,
} = useShopGetProducts(params)

const allProductsCountQuery = useShopGetProducts(productCountBaseParams)
const activeProductsCountQuery = useShopGetProducts(computed(() => ({
  ...productCountBaseParams.value,
  state: ProductStates.ACTIVE,
})))
const inactiveProductsCountQuery = useShopGetProducts(computed(() => ({
  ...productCountBaseParams.value,
  state: ProductStates.INACTIVE,
})))
const draftProductsCountQuery = useShopGetProducts(computed(() => ({
  ...productCountBaseParams.value,
  state: ProductStates.DRAFT,
})))

const { data: dataMyShop } = useGetMyShop()

const totalProducts = computed(() => {
  const response = dataShopGetProducts.value as {
    items?: unknown[]
    meta?: {
      total?: number
      total_results?: number
      total_pages?: number
      limit?: number
    }
  } | undefined

  const total = response?.meta?.total ?? response?.meta?.total_results
  if (typeof total === 'number' && total > 0) {
    return total
  }

  if (
    typeof response?.meta?.total_pages === 'number'
    && response.meta.total_pages > 0
  ) {
    return response.meta.total_pages * (response.meta.limit ?? pageCount)
  }

  return response?.items?.length ?? 0
})
const stateTabCounts = computed(() => {
  const counts = dataShopGetProducts.value?.state_counts

  if (counts) {
    return counts
  }

  return {
    all: allProductsCountQuery.data.value?.meta.total ?? totalProducts.value,
    active: activeProductsCountQuery.data.value?.meta.total ?? 0,
    inactive: inactiveProductsCountQuery.data.value?.meta.total ?? 0,
    draft: draftProductsCountQuery.data.value?.meta.total ?? 0,
  }
})

function handleToolbarChange(payload: Partial<ListShopProductsRequest>) {
  activeFilters.value = payload
}

watch(stateFilter, () => {
  page.value = 1
})
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Products
    </template>
    <template #actions>
      <UButton
        :to="`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}${ROUTES.NEW}`"
        size="sm"
      >
        + Create product
      </UButton>
    </template>
    <template #content>
      <ProductsStateTabs
        v-model="stateFilter"
        :counts="stateTabCounts"
      />
      <ProductsFilterToolbar
        v-model:state-filter="stateFilter"
        @change="handleToolbarChange"
        @reset-page="page = 1"
      />
      <ProductsTable
        :products="dataShopGetProducts?.items ?? []"
        :loading="isPendingShopGetProducts"
        :page="page"
        :page-count="pageCount"
        :total="totalProducts"
        :shop-slug="dataMyShop?.slug"
        @update:page="page = $event"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
