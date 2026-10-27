<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import OrdersFilterToolbar from './orders-filter-toolbar.vue'
import OrdersPermissionState from './orders-permission-state.vue'
import OrdersTable from './orders-table.vue'
import OrdersTableSkeleton from './orders-table-skeleton.vue'
import { ADMIN_ORDERS_PAGE_SIZE, useAdminOrdersList } from '../_composables/use-admin-orders-list'

const {
  page,
  status,
  search,
  query,
  isPermissionDenied,
} = useAdminOrdersList()

const entries = computed(() => query.data.value?.results ?? [])
const totalResults = computed(() => query.data.value?.total_results ?? 0)

function retry() {
  void query.refetch()
}
</script>

<template>
  <LayoutAdminWrapperContent content-class="pb-12">
    <template #title>
      Orders
    </template>
    <template #description>
      All marketplace orders, across every shop.
    </template>
    <template #content>
      <OrdersPermissionState v-if="isPermissionDenied" />

      <Empty
        v-else-if="query.isError.value"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load orders"
        description="Something went wrong while loading the order list. Please try again."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      >
        <template #actions>
          <UButton
            color="gray"
            @click="retry"
          >
            Try again
          </UButton>
        </template>
      </Empty>

      <template v-else>
        <OrdersFilterToolbar
          v-model:search="search"
          v-model:status="status"
          @reset-page="page = 1"
        />

        <OrdersTableSkeleton v-if="query.isPending.value" />

        <OrdersTable
          v-else
          :orders="entries"
          :page="page"
          :page-count="ADMIN_ORDERS_PAGE_SIZE"
          :total="totalResults"
          @update:page="page = $event"
        />
      </template>
    </template>
  </LayoutAdminWrapperContent>
</template>
