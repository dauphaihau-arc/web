<script lang="ts" setup>
import dayjs from 'dayjs'
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import { formatMinorCurrency, fromMinorUnits, toCurrencyOption } from '@arc/utils'
import AppIcon from '@arc/ui/app-icon.vue'
import LoadingSvg from '@arc/ui/loading-svg.vue'
import StatusBadge from '@arc/ui/status-badge.vue'
import OrderDetailSlide from './order-detail-slide/order-detail-slide.vue'
import type { DropdownItem } from '#ui/types'
import FixedPagination from '~/app/components/fixed-pagination.vue'
import type { ShopOrderSummary } from '~/shared/api/shop/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'
import DataTable from '~/shared/ui/data-table/data-table.vue'

const props = defineProps<{
  orders: ShopOrderSummary[]
  loading: boolean
  page: number
  pageCount: number
  total: number
}>()

type OrderTableRow = {
  id: string
  order: string
  status: string
  customer: string
  items: string
  shipping: string
  total: string
  created_at: string
  raw: ShopOrderSummary
}

const { orders, loading, page, pageCount, total } = toRefs(props)

const emit = defineEmits<{
  'update:page': [value: number]
}>()

const selected = ref([])
const slideoverOpen = ref(false)
const selectedDetailRow = ref<OrderTableRow | null>(null)

const rows = computed<OrderTableRow[]>(() => {
  return orders.value.map(order => ({
    items: formatItems(order.products.reduce((sum, product) => sum + product.quantity, 0)),
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

const columns = [
  { key: 'order', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total' },
  { key: 'items', label: 'Items' },
  { key: 'created_at', label: 'Order Date' },
  { key: 'status', label: 'Payment' },
  { key: 'shipping', label: 'Fulfillment' },
  { key: 'actions' },
]

function openDetail(row: OrderTableRow) {
  navigateTo(routes.orderDetail(row.id))
}

function openDetailSlideover(row: OrderTableRow) {
  selectedDetailRow.value = row
  slideoverOpen.value = true
}

const itemsDropdownWithRow = (row: OrderTableRow): DropdownItem[][] => [
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
    case OrderShippingStatuses.SHIPPED:
      return 'green'
    case OrderShippingStatuses.IN_TRANSIT:
      return 'blue'
    case OrderShippingStatuses.PRE_TRANSIT:
      return 'yellow'
    default:
      return 'gray'
  }
}

function orderTone(status: OrderTableRow['raw']['status']) {
  switch (status) {
    case OrderStatuses.PAID:
    case OrderStatuses.COMPLETED:
      return 'green'
    case OrderStatuses.PENDING:
      return 'yellow'
    case OrderStatuses.CANCELED:
    case OrderStatuses.REFUNDED:
    case OrderStatuses.EXPIRED:
    case OrderStatuses.ARCHIVED:
      return 'red'
    default:
      return 'gray'
  }
}

function formatItems(quantity: number) {
  return `${quantity} ${quantity === 1 ? 'pc' : 'pcs'}`
}

function formatAmountWithShortLabel(amountMinor: number, currency: string) {
  const amount = fromMinorUnits(amountMinor, currency)
  const currencyLabel = toCurrencyOption(currency).shortLabel

  return `${amount.toFixed(2)} ${currencyLabel}`
}
</script>

<template>
  <div>
    <DataTable
      v-model="selected"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :empty-state="{ icon: 'archive', label: 'No orders yet.' }"
      clickable-rows
      @row-click="row => openDetailSlideover(row as OrderTableRow)"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AppIcon
            name="archive"
            size="lg"
            class="text-text-muted"
          />
          <p class="text-sm text-text-muted">
            No orders yet.
          </p>
        </div>
      </template>

      <template #order-data="{ row }">
        <div class="font-medium">
          {{ row.order }}
        </div>
      </template>

      <template #status-data="{ row }">
        <StatusBadge
          :color="orderTone(row.raw.status)"
          class="capitalize"
        >
          {{ row.status }}
        </StatusBadge>
      </template>

      <template #customer-data="{ row }">
        <div class="text-sm text-text-muted">
          {{ row.raw.customer.email }}
        </div>
      </template>

      <template #items-data="{ row }">
        <div class="text-sm text-text-muted">
          {{ row.items }}
        </div>
      </template>

      <template #shipping-data="{ row }">
        <StatusBadge
          :color="shippingTone(row.raw.shipping.shipping_status)"
          class="capitalize"
        >
          {{ row.raw.shipping.shipping_status.replaceAll('_', ' ') }}
        </StatusBadge>
      </template>

      <template #total-data="{ row }">
        <div class="font-medium">
          {{ formatAmountWithShortLabel(row.raw.total_minor, row.raw.currency) }}
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
              @click="openDetail(row)"
            >
              <AppIcon
                name="i-heroicons-eye-20-solid"
                size="xs"
              />
            </UButton>
          </UTooltip>
          <UDropdown :items="itemsDropdownWithRow(row)">
            <template #item="{ item }">
              <div class="flex w-full items-center gap-2">
                <AppIcon
                  v-if="item.icon"
                  :name="item.icon"
                  size="xs"
                  class="text-text-muted"
                />
                <span>{{ item.label }}</span>
              </div>
            </template>

            <UTooltip text="More actions">
              <UButton
                color="gray"
                variant="ghost"
              >
                <AppIcon
                  name="moreHorizontal"
                  size="xs"
                />
              </UButton>
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
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />

    <OrderDetailSlide
      v-if="selectedDetailRow"
      :key="selectedDetailRow.id"
      v-model="slideoverOpen"
      :order-id="selectedDetailRow.id"
      :order-number="selectedDetailRow.order"
    />
  </div>
</template>
