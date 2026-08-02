<script lang="ts" setup>
import dayjs from 'dayjs'
import { OrderStatuses } from '@arc/enums/order'
import { formatMinorCurrency } from '@arc/utils'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import DashboardPanel from './dashboard-panel.vue'
import type { ShopOrderSummary } from '~/domains/shop/api/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  orders: ShopOrderSummary[]
  loading: boolean
}>()

type RecentOrderRow = {
  id: string
  orderNumber: string
  customer: string
  total: string
  status: ShopOrderSummary['status']
  statusLabel: string
  date: string
}

const rows = computed<RecentOrderRow[]>(() =>
  props.orders.map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    customer: order.customer.email,
    total: formatMinorCurrency(order.total_minor, order.currency),
    status: order.status,
    statusLabel: order.status.replaceAll('_', ' '),
    date: dayjs(order.created_at).format('MMM D, h:mma'),
  })),
)

const desktopColumns = [
  { key: 'orderNumber', label: 'Order' },
  { key: 'total', label: 'Total', class: 'w-28' },
  { key: 'status', label: 'Status', class: 'w-36 text-right' },
]

const wrappedColumns = [
  { key: 'orderNumber', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

const tableUi = {
  divide: 'divide-y divide-border-subtle',
  tbody: 'divide-y divide-border-subtle',
} as const

function orderTone(status: ShopOrderSummary['status']) {
  switch (status) {
    case OrderStatuses.PAID:
    case OrderStatuses.COMPLETED:
      return 'green'
    case OrderStatuses.PENDING:
    case OrderStatuses.AWAITING_PAYMENT:
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
</script>

<template>
  <DashboardPanel
    title="Recent orders"
    description="Latest orders in the selected period."
  >
    <template #header-end>
      <UButton
        :to="routes.orders()"
        color="gray"
        variant="ghost"
        size="sm"
      >
        View orders
      </UButton>
    </template>

    <div class="xl:hidden">
      <UTable
        :rows="rows"
        :columns="wrappedColumns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No orders in this period.' }"
        :ui="tableUi"
      >
        <template #orderNumber-data="{ row }">
          <NuxtLink
            :to="routes.orderDetail(row.id)"
            class="font-medium text-text-strong"
          >
            {{ row.orderNumber }}
          </NuxtLink>
        </template>

        <template #customer-data="{ row }">
          <div class="max-w-[220px] truncate text-sm text-text-subtle">
            {{ row.customer }}
          </div>
        </template>

        <template #total-data="{ row }">
          <div class="font-medium text-text-strong">
            {{ row.total }}
          </div>
        </template>

        <template #status-data="{ row }">
          <StatusBadge
            :color="orderTone(row.status)"
            class="capitalize"
          >
            {{ row.statusLabel }}
          </StatusBadge>
        </template>

        <template #date-data="{ row }">
          <div class="text-sm text-text-subtle">
            {{ row.date }}
          </div>
        </template>

        <template #empty-state>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <AppIcon
              name="i-heroicons-archive-box-20-solid"
              size="lg"
              class="text-text-muted"
            />
            <div class="text-sm text-text-muted">
              No orders in this period.
            </div>
          </div>
        </template>

        <template #loading-state>
          <div class="grid h-56 w-full place-content-center">
            <LoadingSvg :child-class="'!w-12 !h-12'" />
          </div>
        </template>
      </UTable>
    </div>

    <div class="hidden xl:block">
      <UTable
        :rows="rows"
        :columns="desktopColumns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No orders in this period.' }"
        :ui="tableUi"
      >
        <template #orderNumber-data="{ row }">
          <NuxtLink
            :to="routes.orderDetail(row.id)"
            class="font-medium text-text-strong"
          >
            {{ row.orderNumber }}
          </NuxtLink>
        </template>

        <template #total-data="{ row }">
          <div class="font-medium text-text-strong">
            {{ row.total }}
          </div>
        </template>

        <template #status-data="{ row }">
          <div class="flex justify-end">
            <StatusBadge
              :color="orderTone(row.status)"
              class="capitalize"
            >
              {{ row.statusLabel }}
            </StatusBadge>
          </div>
        </template>

        <template #empty-state>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <AppIcon
              name="i-heroicons-archive-box-20-solid"
              size="lg"
              class="text-text-muted"
            />
            <div class="text-sm text-text-muted">
              No orders in this period.
            </div>
          </div>
        </template>

        <template #loading-state>
          <div class="grid h-56 w-full place-content-center">
            <LoadingSvg :child-class="'!w-12 !h-12'" />
          </div>
        </template>
      </UTable>
    </div>
  </DashboardPanel>
</template>
