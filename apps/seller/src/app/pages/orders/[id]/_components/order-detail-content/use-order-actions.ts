import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { OrderShippingStatuses, OrderStatuses, PaymentTypes } from '@arc/enums/order'
import { useOrderShipmentState } from './use-order-shipment-state'
import type { ShopOrder } from '~/shared/types/shop-order-detail'

export function useOrderActions(orderSource: MaybeRefOrGetter<ShopOrder | undefined>) {
  const order = computed(() => toValue(orderSource))
  const { allowedShipmentTransitions, canTransitionTo } = useOrderShipmentState(order)

  const canRefund = computed(() =>
    !!order.value
    && order.value.payment.type === PaymentTypes.CARD
    && [undefined, 'failed'].includes(order.value.payment.refund_status)
    && (
      (order.value.status === OrderStatuses.PAID && order.value.shipping.shipping_status !== OrderShippingStatuses.PRE_TRANSIT)
      || order.value.status === OrderStatuses.COMPLETED
    ),
  )

  const canCancel = computed(() =>
    !!order.value
    && [OrderStatuses.PAID, OrderStatuses.PENDING].includes(order.value.status)
    && order.value.shipping.shipping_status === OrderShippingStatuses.PRE_TRANSIT,
  )

  const canRetryRefund = computed(() =>
    !!order.value
    && order.value.payment.type === PaymentTypes.CARD
    && order.value.payment.refund_status === 'failed'
    && [OrderStatuses.CANCELED, OrderStatuses.PAID, OrderStatuses.COMPLETED].includes(order.value.status),
  )

  const primaryShipmentAction = computed(() => {
    const candidates = [
      {
        status: OrderShippingStatuses.DELIVERED,
        label: 'Mark delivered',
        icon: 'i-heroicons-check-circle-20-solid',
      },
      {
        status: OrderShippingStatuses.SHIPPED,
        label: 'Mark shipped',
        icon: 'i-heroicons-arrow-up-on-square-20-solid',
      },
      {
        status: OrderShippingStatuses.IN_TRANSIT,
        label: 'Mark in transit',
        icon: 'i-heroicons-truck-20-solid',
      },
    ] as const

    return candidates.find(candidate => canTransitionTo(candidate.status))
  })

  return {
    allowedShipmentTransitions,
    canCancel,
    canRefund,
    canRetryRefund,
    canTransitionTo,
    primaryShipmentAction,
  }
}
