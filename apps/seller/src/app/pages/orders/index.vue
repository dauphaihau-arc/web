<script lang="ts" setup>
import OrdersFilterToolbar from './_components/orders-filter-toolbar/orders-filter-toolbar.vue'
import OrdersTable from './_components/orders-table.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { useShopGetOrders } from '~/shared/server-state/shop/order/list.query'
import type { ListShopOrdersRequest } from '~/shared/api/shop/order/contracts/order.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const pageCount = 20
const page = ref(1)
const activeFilters = ref<Partial<ListShopOrdersRequest>>({})

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
  ...activeFilters.value,
}))

const {
  isPending,
  data,
} = useShopGetOrders(params)

function handleToolbarChange(payload: Partial<ListShopOrdersRequest>) {
  activeFilters.value = payload
}
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Orders & Shipping
    </template>
    <template #description>
      Review paid orders and keep shipment status up to date for buyers.
    </template>
    <template #content>
      <OrdersFilterToolbar
        @change="handleToolbarChange"
        @reset-page="page = 1"
      />
      <OrdersTable
        :orders="data?.results ?? []"
        :loading="isPending"
        :page="page"
        :page-count="pageCount"
        :total="data?.total_results ?? 0"
        @update:page="page = $event"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
