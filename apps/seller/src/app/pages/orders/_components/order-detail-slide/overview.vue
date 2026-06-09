<script lang="ts" setup>
import dayjs from 'dayjs'
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import type { ShopOrder } from '~/app/pages/orders/[id]/_components/order-detail-content/types'

const props = defineProps<{
  order: ShopOrder
}>()

const createdLabel = computed(() => dayjs(props.order.created_at).format('MMM D, YYYY [at] h:mma'))
const orderStatusLabel = computed(() => props.order.status.replaceAll('_', ' '))
const shippingStatusLabel = computed(() => props.order.shipping.shipping_status.replaceAll('_', ' '))

function orderStatusTone(status: ShopOrder['status']) {
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

function shippingStatusTone(status: ShopOrder['shipping']['shipping_status']) {
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
  <div class="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
    <div class="space-y-2">
      <div class="text-sm text-text-muted">
        Created at
      </div>
      <div class="font-medium text-sm text-text-strong">
        {{ createdLabel }}
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-sm text-text-muted">
        Status
      </div>
      <div>
        <StatusBadge
          :color="orderStatusTone(order.status)"
          class="capitalize"
        >
          {{ orderStatusLabel }}
        </StatusBadge>
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-sm text-text-muted">
        Fulfillment
      </div>
      <div>
        <StatusBadge
          :color="shippingStatusTone(order.shipping.shipping_status)"
          class="capitalize"
        >
          {{ shippingStatusLabel }}
        </StatusBadge>
      </div>
    </div>
  </div>
</template>
