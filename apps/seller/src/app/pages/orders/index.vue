<script lang="ts" setup>
import dayjs from 'dayjs'
import { OrderShippingStatuses } from '@arc/enums/order'
import { formatMinorCurrency } from '@arc/utils'
import LoadingSvg from '@arc/ui/loading-svg.vue'
import SellerOrderDetailContent from './_components/order-detail-content.vue'
import OrdersFilterToolbar from './_components/orders-filter-toolbar/orders-filter-toolbar.vue'
import type { DropdownItem } from '#ui/types'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/fixed-pagination.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetOrders } from '~/shared/server-state/shop/order/list.query'
import DataTable from '~/shared/ui/data-table/data-table.vue'
import type { ListShopOrdersRequest, ShopOrderSummary } from '~/shared/api/shop/order/contracts/order.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const selected = ref([])
const pageCount = 20
const page = ref(1)
const slideoverOpen = ref(false)
const selectedDetailRow = ref<Row | null>(null)
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

const columns = [
  { key: 'order', label: 'Order' },
  { key: 'status', label: 'Status' },
  { key: 'customer', label: 'Customer' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions' },
]

type Row = {
  id: string
  order: string
  status: string
  customer: string
  shipping: string
  total: string
  created_at: string
  raw: ShopOrderSummary
}

const rows = computed<Row[]>(() => {
  return (data.value?.results ?? []).map(order => ({
    id: order.id,
    order: order.order_number,
    status: order.status.replaceAll('_', ' '),
    customer: order.customer.full_name,
    shipping: order.shipping.shipping_status.replaceAll('_', ' '),
    total: formatMinorCurrency(order.total_minor, order.currency),
    created_at: dayjs(order.created_at).format('MMM DD, YYYY'),
    raw: order,
  }))
})

function openDetail(row: Row) {
  navigateTo(routes.orderDetail(row.id))
}

function openDetailSlideover(row: Row) {
  selectedDetailRow.value = row
  slideoverOpen.value = true
}

const itemsDropdownWithRow = (row: Row): DropdownItem[][] => [
  [
    {
      label: 'Open page',
      icon: 'i-heroicons-eye-20-solid',
      click: () => openDetail(row),
    },
  ],
]

function shippingTone(status: OrderShippingStatuses) {
  switch (status) {
    case OrderShippingStatuses.DELIVERED:
      return 'green'
    case OrderShippingStatuses.SHIPPED:
      return 'blue'
    case OrderShippingStatuses.IN_TRANSIT:
      return 'yellow'
    default:
      return 'gray'
  }
}

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

      <DataTable
        v-model="selected"
        :rows="rows"
        :columns="columns"
        :loading="isPending"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No orders yet.' }"
        clickable-rows
        @row-click="row => openDetailSlideover(row as Row)"
      >
        <template #order-data="{ row }">
          <div class="font-medium">
            {{ row.order }}
          </div>
        </template>

        <template #status-data="{ row }">
          <UBadge color="green">
            {{ row.status }}
          </UBadge>
        </template>

        <template #customer-data="{ row }">
          <div class="space-y-1">
            <div>{{ row.raw.customer.full_name }}</div>
            <div class="text-xs text-text-muted">
              {{ row.raw.customer.email }}
            </div>
          </div>
        </template>

        <template #shipping-data="{ row }">
          <div class="space-y-1">
            <UBadge
              :color="shippingTone(row.raw.shipping.shipping_status)"
            >
              {{ row.raw.shipping.shipping_status.replaceAll('_', ' ') }}
            </UBadge>
            <div class="text-xs text-text-muted">
              {{ row.raw.shipping.to_country }}
            </div>
          </div>
        </template>

        <template #total-data="{ row }">
          <div class="font-medium">
            {{ row.total }}
          </div>
        </template>

        <template #actions-data="{ row }">
          <div class="flex w-full items-center justify-end gap-1">
            <UTooltip text="Open page">
              <UButton
                color="gray"
                variant="ghost"
                data-row-hover-action
                class="p-1.5 transition-opacity"
                icon="i-heroicons-eye-20-solid"
                @click="openDetail(row)"
              />
            </UTooltip>
            <UDropdown :items="itemsDropdownWithRow(row)">
              <UTooltip text="More actions">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                />
              </UTooltip>
            </UDropdown>
          </div>
        </template>

        <template #loading-state>
          <div class="grid h-[70vh] w-full place-content-center">
            <LoadingSvg :child-class="'!w-12 !h-12'" />
          </div>
        </template>
      </DataTable>

      <FixedPagination
        :page="page"
        :page-count="pageCount"
        :total="data?.total_results ?? 0"
        @on-change-page="(val) => page = val"
      />

      <USlideover
        v-model="slideoverOpen"
        side="right"
        :ui="{ width: 'max-w-[min(92vw,1080px)] sm:max-w-[min(92vw,1080px)]' }"
      >
        <div class="flex h-full flex-col bg-surface">
          <div class="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <div>
              <div class="text-lg font-semibold">
                {{ selectedDetailRow?.order || 'Order detail' }}
              </div>
              <div class="text-sm text-text-muted">
                Review and update shipment info without leaving the orders list.
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="selectedDetailRow"
                color="gray"
                variant="ghost"
                :to="routes.orderDetail(selectedDetailRow.id)"
              >
                Open page
              </UButton>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                @click="slideoverOpen = false"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <SellerOrderDetailContent
              v-if="selectedDetailRow"
              :key="selectedDetailRow.id"
              :order-id="selectedDetailRow.id"
            />
          </div>
        </div>
      </USlideover>
    </template>
  </LayoutShopWrapperContent>
</template>
