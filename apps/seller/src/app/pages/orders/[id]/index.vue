<script lang="ts" setup>
import dayjs from 'dayjs'
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import StatusBadge from '@arc/ui/status-badge.vue'
import OrderDetailActions from './_components/order-detail-actions.vue'
import SellerOrderDetailContent from '~/app/pages/orders/[id]/_components/order-detail-content/order-detail-content.vue'
import type { ShopOrder } from '~/app/pages/orders/[id]/_components/order-detail-content/types'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetOrderDetail } from '~/shared/server-state/shop/order/detail.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))
const { data } = useShopGetOrderDetail(orderId.value)
const order = computed(() => data.value?.order)

const createdLabel = computed(() => {
  if (!order.value) return ''

  return dayjs(order.value.created_at).format('MMM D, YYYY [at] h:mma')
})

const orderStatusLabel = computed(() => order.value?.status.replaceAll('_', ' ') ?? '')
const shippingStatusLabel = computed(() => order.value?.shipping.shipping_status.replaceAll('_', ' ') ?? '')

function orderStatusTone(status?: ShopOrder['status']) {
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

function shippingStatusTone(status?: ShopOrder['shipping']['shipping_status']) {
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
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Back to orders"
    :back-to="routes.orders()"
    content-class="pb-12"
  >
    <template #title>
      <span class="inline-flex flex-wrap items-center gap-3">
        <span>{{ order ? `Order number: ${order.order_number}` : 'Order details' }}</span>
        <StatusBadge
          v-if="order"
          :color="orderStatusTone(order.status)"
          size="sm"
          class="capitalize"
        >
          {{ orderStatusLabel }}
        </StatusBadge>
        <StatusBadge
          v-if="order"
          :color="shippingStatusTone(order.shipping.shipping_status)"
          size="sm"
          class="capitalize"
        >
          {{ shippingStatusLabel }}
        </StatusBadge>
      </span>
    </template>
    <template
      v-if="order"
      #description
    >
      Created {{ createdLabel }}
    </template>
    <template #actions>
      <OrderDetailActions :order-id="orderId" />
    </template>
    <template #content>
      <SellerOrderDetailContent
        :key="orderId"
        :order-id="orderId"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
