<script lang="ts" setup>
import type { OrderStatuses } from '@arc/enums/order'
import OrdersStatusTabs from './_components/orders-status-tabs.vue'
import OrdersTable from './_components/orders-table.vue'
import OrderFilterToolbar from '~/app/pages/orders/_components/order-filter-toolbar/order-filter-toolbar.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { useShopGetOrders } from '~/shared/server-state/shop/order/list.query'
import type { ListShopOrdersRequest } from '~/shared/api/shop/order/contracts/order.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const pageCount = 20
const page = ref(1)
const activeFilters = ref<Partial<ListShopOrdersRequest>>({})
const statusFilter = ref<OrderStatuses[]>([])

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
  ...activeFilters.value,
}))

const orderCountBaseParams = computed<ListShopOrdersRequest>(() => ({
  ...activeFilters.value,
  page: 1,
  limit: 1,
  status: undefined,
}))

const {
  isPending,
  data,
} = useShopGetOrders(params)

const orderCountsQuery = useShopGetOrders(orderCountBaseParams)

function handleToolbarChange(payload: Partial<ListShopOrdersRequest>) {
  activeFilters.value = payload
}

watch(statusFilter, () => {
  page.value = 1
}, { deep: true })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Orders
    </template>
    <template #content>
      <OrdersStatusTabs
        v-model="statusFilter"
        :counts="orderCountsQuery.data.value?.status_counts ?? data?.status_counts"
      />
      <OrderFilterToolbar
        v-model:status-filter="statusFilter"
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
