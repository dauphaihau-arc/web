<script lang="ts" setup>
import dayjs from 'dayjs'
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment'
import { OrderStatuses } from '@arc/enums/order'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import OrderDetailActions from './_components/order-detail-actions.vue'
import OrderDetailContent from '~/app/pages/orders/[id]/_components/order-detail-content/order-detail-content.vue'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetOrderDetail } from '~/domains/shop/queries/order/detail.query'

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
const fulfillmentStatusLabel = computed(() => order.value?.fulfillment.status.replaceAll('_', ' ') ?? '')

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

function fulfillmentStatusTone(status?: FulfillmentAggregateStatuses) {
  switch (status) {
    case FulfillmentAggregateStatuses.DELIVERED:
    case FulfillmentAggregateStatuses.PARTIALLY_DELIVERED:
      return 'green'
    case FulfillmentAggregateStatuses.PARTIALLY_SHIPPED:
    case FulfillmentAggregateStatuses.SHIPPED:
    case FulfillmentAggregateStatuses.DISPATCHED:
    case FulfillmentAggregateStatuses.IN_TRANSIT:
      return 'blue'
    case FulfillmentAggregateStatuses.PREPARED:
      return 'yellow'
    case FulfillmentAggregateStatuses.UNFULFILLED:
    case FulfillmentAggregateStatuses.CANCELED:
    default:
      return 'gray'
  }
}
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Orders"
    :back-to="routes.orders()"
    content-class="pb-12"
  >
    <template #title>
      <span class="inline-flex flex-wrap items-center gap-3">
        <span>{{ order ? `Order number: ${order.order_number}` : 'Order details' }}</span>
        <StatusBadge
          v-if="order"
          :color="orderStatusTone(order.status)"
          class="capitalize"
        >
          {{ orderStatusLabel }}
        </StatusBadge>
        <StatusBadge
          v-if="order"
          :color="fulfillmentStatusTone(order.fulfillment.status)"
          class="capitalize"
        >
          {{ fulfillmentStatusLabel }}
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
      <OrderDetailContent
        :key="orderId"
        :order-id="orderId"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
