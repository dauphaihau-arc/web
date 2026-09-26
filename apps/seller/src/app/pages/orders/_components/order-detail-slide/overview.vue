<script lang="ts" setup>
import dayjs from 'dayjs'
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment'
import { OrderStatuses } from '@arc/enums/order'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
}>()

const createdLabel = computed(() => dayjs(props.order.created_at).format('MMM D, YYYY [at] h:mma'))
const orderStatusLabel = computed(() => props.order.status.replaceAll('_', ' '))
const fulfillmentStatusLabel = computed(() => props.order.fulfillment.status.replaceAll('_', ' '))

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

function fulfillmentStatusTone(status: FulfillmentAggregateStatuses) {
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
  <div class="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
    <div class="space-y-2">
      <div class="text-sm text-text-muted">
        Created at
      </div>
      <div class="text-sm font-medium text-text-strong">
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
          :color="fulfillmentStatusTone(order.fulfillment.status)"
          class="capitalize"
        >
          {{ fulfillmentStatusLabel }}
        </StatusBadge>
      </div>
    </div>
  </div>
</template>
