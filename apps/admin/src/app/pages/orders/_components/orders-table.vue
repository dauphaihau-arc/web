<script setup lang="ts">
import type { AdminOrderListEntry } from '~/domains/orders/api/contracts/admin-orders.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import DataTable from '@arc/ui/patterns/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import {
  formatOrderAmount,
  formatOrderDate,
  formatOrderStatusLabel,
  fulfillmentStatusTone,
  orderStatusTone,
} from '~/domains/orders/utils/order-presentation'
import FixedPagination from '@arc/ui/patterns/fixed-pagination.vue'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  orders: AdminOrderListEntry[]
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

type OrderTableRow = {
  id: string
  order: string
  shop: string
  customer: string
  status: string
  total: string
  created_at: string
  raw: AdminOrderListEntry
}

const rows = computed<OrderTableRow[]>(() =>
  props.orders.map(order => ({
    id: order.id,
    order: order.order_number,
    shop: order.shop.shop_name,
    customer: order.customer.email,
    status: formatOrderStatusLabel(order.status),
    total: formatOrderAmount(order.total_minor, order.currency),
    created_at: formatOrderDate(order.created_at),
    raw: order,
  })),
)

const columns = [
  { key: 'order', label: 'Order' },
  { key: 'shop', label: 'Shop' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'fulfillment', label: 'Fulfillment' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions' },
]

function openDetail(row: OrderTableRow) {
  return navigateTo(routes.orderDetail(row.id))
}
</script>

<template>
  <div>
    <DataTable
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="{ icon: 'archive', label: 'No orders found.' }"
      clickable-rows
      @row-click="row => openDetail(row as OrderTableRow)"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AppIcon
            name="archive"
            size="lg"
            class="text-text-muted"
          />
          <p class="text-sm text-text-muted">
            No orders match the current filters.
          </p>
        </div>
      </template>

      <template #order-data="{ row }">
        <div class="text-sm font-medium text-text-strong">
          {{ row.order }}
        </div>
      </template>

      <template #shop-data="{ row }">
        <div class="space-y-0.5">
          <div class="text-sm text-text-strong">
            {{ row.shop }}
          </div>
          <div class="text-xs text-text-muted">
            {{ row.raw.shop.slug }}
          </div>
        </div>
      </template>

      <template #customer-data="{ row }">
        <div class="break-all text-sm text-text-muted">
          {{ row.customer }}
        </div>
      </template>

      <template #status-data="{ row }">
        <StatusBadge
          :color="orderStatusTone(row.raw.status)"
          class="capitalize"
        >
          {{ row.status }}
        </StatusBadge>
      </template>

      <template #fulfillment-data="{ row }">
        <StatusBadge
          :color="fulfillmentStatusTone(row.raw.fulfillment.status)"
          class="capitalize"
        >
          {{ formatOrderStatusLabel(row.raw.fulfillment.status) }}
        </StatusBadge>
      </template>

      <template #total-data="{ row }">
        <div class="font-medium">
          {{ row.total }}
        </div>
      </template>

      <template #created_at-data="{ row }">
        <div class="text-sm text-text-muted">
          {{ row.created_at }}
        </div>
      </template>

      <template #actions-data="{ row }">
        <div class="flex w-full items-center justify-end">
          <UTooltip text="Open order">
            <UButton
              color="gray"
              variant="ghost"
              data-row-hover-action
              class="p-1.5"
              @click="openDetail(row as OrderTableRow)"
            >
              <AppIcon
                :name="ICON_NAME_BY_ALIAS.preview"
                size="xs"
              />
            </UButton>
          </UTooltip>
        </div>
      </template>
    </DataTable>

    <FixedPagination
      :page="page"
      :page-count="pageCount"
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
