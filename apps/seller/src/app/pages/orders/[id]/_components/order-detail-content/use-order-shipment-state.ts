import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import type { ShopOrder } from './types'

const SHIPMENT_BLOCKED_ORDER_STATUSES = [
  OrderStatuses.CANCELED,
  OrderStatuses.REFUNDED,
  OrderStatuses.EXPIRED,
  OrderStatuses.ARCHIVED,
  OrderStatuses.AWAITING_PAYMENT,
]

export function useOrderShipmentState(orderSource: MaybeRefOrGetter<ShopOrder | undefined>) {
  const order = computed(() => toValue(orderSource))

  const shipmentUpdatesBlocked = computed(() =>
    !!order.value && SHIPMENT_BLOCKED_ORDER_STATUSES.includes(order.value.status),
  )

  const allowedShipmentTransitions = computed<OrderShippingStatuses[]>(() => {
    if (!order.value || shipmentUpdatesBlocked.value) return []

    switch (order.value.shipping.shipping_status) {
      case OrderShippingStatuses.PRE_TRANSIT:
        return [OrderShippingStatuses.IN_TRANSIT, OrderShippingStatuses.SHIPPED]
      case OrderShippingStatuses.IN_TRANSIT:
        return [OrderShippingStatuses.SHIPPED, OrderShippingStatuses.DELIVERED]
      case OrderShippingStatuses.SHIPPED:
        return [OrderShippingStatuses.DELIVERED]
      case OrderShippingStatuses.DELIVERED:
      default:
        return []
    }
  })

  const canEditShipmentInfo = computed(() => !shipmentUpdatesBlocked.value)

  function canTransitionTo(status: OrderShippingStatuses) {
    return allowedShipmentTransitions.value.includes(status)
  }

  return {
    allowedShipmentTransitions,
    canEditShipmentInfo,
    canTransitionTo,
    shipmentUpdatesBlocked,
  }
}
