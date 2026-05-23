<script lang="ts" setup>
import dayjs from 'dayjs'
import type { DropdownItem } from '#ui/types'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/account/shop/fixed-pagination.vue'
import { OrderShippingStatuses, OrderStatuses } from '~/shared/config/enums/order'
import { routes } from '~/shared/navigation/routes'
import { useShopGetOrders } from '~/shared/server-state/shop/order/list.query'
import type { ShopOrderSummary } from '~/shared/api/shop/order/contracts/order.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const selected = ref([])
const pageCount = 20
const page = ref(1)
const statusFilter = ref<OrderStatuses | undefined>()

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
  ...(statusFilter.value ? { status: statusFilter.value } : {}),
}))

const {
  isPending,
  data,
} = useShopGetOrders(params)

const statusTabs = [
  { label: 'All', value: undefined },
  { label: 'Paid', value: OrderStatuses.PAID },
  { label: 'Canceled', value: OrderStatuses.CANCELED },
  { label: 'Completed', value: OrderStatuses.COMPLETED },
] as const

const columns = [
  { key: 'order', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions' },
]

type Row = {
  id: string
  order: string
  customer: string
  shipping: string
  total: string
  created_at: string
  raw: ShopOrderSummary
}

const rows = computed<Row[]>(() => {
  return data.value?.results.map(order => ({
    id: order.id,
    order: order.status.replaceAll('_', ' '),
    customer: order.customer.full_name,
    shipping: order.shipping.shipping_status.replaceAll('_', ' '),
    total: String(convertCurrency(order.total)),
    created_at: dayjs(order.created_at).format('MMM DD, YYYY'),
    raw: order,
  })) ?? []
})

function openDetail(row: Row) {
  navigateTo(routes.accountShopOrderDetail(row.id))
}

const itemsDropdownWithRow = (row: Row): DropdownItem[][] => [
  [
    {
      label: 'Open',
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
      <div class="mb-6 flex gap-3">
        <UButton
          v-for="tab in statusTabs"
          :key="tab.label"
          :variant="statusFilter === tab.value ? 'solid' : 'ghost'"
          color="gray"
          @click="statusFilter = tab.value"
        >
          {{ tab.label }}
        </UButton>
      </div>

      <UTable
        v-model="selected"
        :rows="rows"
        :columns="columns"
        :loading="isPending"
        :empty-state="{ icon: 'i-heroicons-shopping-bag-20-solid', label: 'No orders yet.' }"
      >
        <template #order-data="{ row }">
          <div class="space-y-1">
            <div class="font-medium">
              #{{ row.id.slice(0, 8) }}
            </div>
            <UBadge
              color="gray"
              variant="subtle"
            >
              {{ row.raw.status.replaceAll('_', ' ') }}
            </UBadge>
          </div>
        </template>

        <template #customer-data="{ row }">
          <div class="space-y-1">
            <div>{{ row.raw.customer.full_name }}</div>
            <div class="text-xs text-zinc-500">
              {{ row.raw.customer.email }}
            </div>
          </div>
        </template>

        <template #shipping-data="{ row }">
          <div class="space-y-1">
            <UBadge
              :color="shippingTone(row.raw.shipping.shipping_status)"
              variant="subtle"
            >
              {{ row.raw.shipping.shipping_status.replaceAll('_', ' ') }}
            </UBadge>
            <div class="text-xs text-zinc-500">
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
          <div class="flex justify-end">
            <UDropdown :items="itemsDropdownWithRow(row)">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-ellipsis-horizontal-20-solid"
              />
            </UDropdown>
          </div>
        </template>

        <template #loading-state>
          <div class="grid h-[70vh] w-full place-content-center">
            <LoadingSvg :child-class="'!w-12 !h-12'" />
          </div>
        </template>
      </UTable>

      <FixedPagination
        :page="page"
        :page-count="pageCount"
        :total="data?.total_results"
        @on-change-page="(val) => page = val"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
