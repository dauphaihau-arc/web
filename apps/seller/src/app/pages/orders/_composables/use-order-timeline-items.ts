import dayjs from 'dayjs'
import { OrderShippingStatuses, OrderStatuses, PaymentTypes } from '@arc/enums/order'
import type { AppIconAlias } from '@arc/ui/app-icon.constants'
import type { TimelineItem } from '@arc/ui/timeline.vue'
import type { ShopOrder, ShopOrderTimelineEvent } from '~/shared/types/shop-order-detail'

type OrderTimelineMilestone = TimelineItem & {
  occurredAt?: Date
  expectedAt?: Date
  icon: AppIconAlias
}

function formatLabel(value?: string | null) {
  if (!value) {
    return ''
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function metaLabel(milestone: { occurredAt?: Date, expectedAt?: Date }) {
  return milestone.occurredAt
    ? dayjs(milestone.occurredAt).format('MMM D, YYYY, h:mm A')
    : milestone.expectedAt
      ? dayjs(milestone.expectedAt).format('MMM D, YYYY')
      : ''
}

export function useOrderTimelineItems(order: MaybeRefOrGetter<ShopOrder>, timeline: MaybeRefOrGetter<ShopOrderTimelineEvent[]>) {
  const resolvedOrder = computed(() => toValue(order))
  const resolvedTimeline = computed(() => toValue(timeline))

  function findEvent(type: ShopOrderTimelineEvent['type']) {
    return resolvedTimeline.value.find(event => event.type === type)
  }

  function buildShippingDescription() {
    const parts = [
      resolvedOrder.value.shipping.shipping_carrier
        ? `Carrier: ${resolvedOrder.value.shipping.shipping_carrier}`
        : '',
      resolvedOrder.value.shipping.tracking_number
        ? `Tracking: ${resolvedOrder.value.shipping.tracking_number}`
        : '',
      resolvedOrder.value.shipping.shipment_note ?? '',
    ].filter(Boolean)

    return parts.join(' • ')
  }

  const paymentConfirmedAt = computed(() => findEvent('payment_succeeded')?.occurred_at)
  const paymentExpiredAt = computed(() => findEvent('payment_expired')?.occurred_at)
  const refundRequestedAt = computed(() => findEvent('refund_requested')?.occurred_at)

  const currentStageKey = computed(() => {
    if (resolvedOrder.value.status === OrderStatuses.REFUNDED) {
      return 'refunded'
    }

    if (
      resolvedOrder.value.status === OrderStatuses.CANCELED
      || resolvedOrder.value.status === OrderStatuses.EXPIRED
      || resolvedOrder.value.status === OrderStatuses.ARCHIVED
    ) {
      return 'canceled'
    }

    switch (resolvedOrder.value.shipping.shipping_status) {
      case OrderShippingStatuses.DELIVERED:
        return 'delivered'
      case OrderShippingStatuses.SHIPPED:
        return 'shipped'
      case OrderShippingStatuses.IN_TRANSIT:
        return 'in_transit'
      case OrderShippingStatuses.PRE_TRANSIT:
      default:
        return 'payment'
    }
  })

  const milestones = computed<OrderTimelineMilestone[]>(() => {
    const items: OrderTimelineMilestone[] = []
    const shippingDescription = buildShippingDescription()
    const paymentIsCard = resolvedOrder.value.payment.type === PaymentTypes.CARD

    if (resolvedOrder.value.status === OrderStatuses.REFUNDED) {
      items.push({
        key: 'refunded',
        title: 'Refund completed',
        description: resolvedOrder.value.payment.refund_failed_reason
          ? resolvedOrder.value.payment.refund_failed_reason
          : 'Summary was refunded successfully.',
        occurredAt: resolvedOrder.value.payment.refunded_at,
        state: 'current',
        icon: 'refund',
      })
    }
    else if (
      resolvedOrder.value.status === OrderStatuses.CANCELED
      || resolvedOrder.value.status === OrderStatuses.EXPIRED
      || resolvedOrder.value.status === OrderStatuses.ARCHIVED
    ) {
      items.push({
        key: 'canceled',
        title: resolvedOrder.value.status === OrderStatuses.EXPIRED ? 'Summary expired' : 'Order canceled',
        description: resolvedOrder.value.cancel_reason
          ?? (resolvedOrder.value.status === OrderStatuses.EXPIRED
            ? 'Checkout session expired before payment completed.'
            : 'This order is no longer active.'),
        occurredAt: resolvedOrder.value.canceled_at ?? paymentExpiredAt.value,
        state: resolvedOrder.value.status === OrderStatuses.EXPIRED ? 'failed' : 'current',
        icon: resolvedOrder.value.status === OrderStatuses.EXPIRED
          ? 'expired'
          : 'xCircle',
      })
    }

    items.push({
      key: 'delivered',
      title: 'Delivered',
      description: 'Shipment delivered successfully.',
      occurredAt: resolvedOrder.value.shipping.delivered_at,
      expectedAt: resolvedOrder.value.shipping.delivered_at
        ? undefined
        : resolvedOrder.value.shipping.estimated_delivery,
      state: currentStageKey.value === 'delivered'
        ? 'current'
        : resolvedOrder.value.shipping.shipping_status === OrderShippingStatuses.DELIVERED
          ? 'completed'
          : 'upcoming',
      icon: 'delivered',
    })

    items.push({
      key: 'shipped',
      title: 'Shipped',
      description: shippingDescription || 'Shipment left the seller and is on the delivery route.',
      occurredAt: resolvedOrder.value.shipping.shipped_at,
      state: currentStageKey.value === 'shipped'
        ? 'current'
        : [OrderShippingStatuses.SHIPPED, OrderShippingStatuses.DELIVERED].includes(resolvedOrder.value.shipping.shipping_status)
            ? 'completed'
            : 'upcoming',
      icon: 'shipping',
    })

    items.push({
      key: 'in_transit',
      title: 'In transit',
      description: shippingDescription || 'Shipment is moving through the delivery network.',
      occurredAt: resolvedOrder.value.shipping.shipping_status === OrderShippingStatuses.IN_TRANSIT
        ? resolvedOrder.value.shipping.updated_at
        : undefined,
      expectedAt: resolvedOrder.value.shipping.shipping_status === OrderShippingStatuses.IN_TRANSIT
        ? resolvedOrder.value.shipping.estimated_delivery
        : undefined,
      state: currentStageKey.value === 'in_transit'
        ? 'current'
        : [OrderShippingStatuses.IN_TRANSIT, OrderShippingStatuses.SHIPPED, OrderShippingStatuses.DELIVERED].includes(resolvedOrder.value.shipping.shipping_status)
            ? 'completed'
            : 'upcoming',
      icon: 'transit',
    })

    items.push({
      key: 'payment',
      title: paymentIsCard
        ? (
            resolvedOrder.value.status === OrderStatuses.AWAITING_PAYMENT
            || resolvedOrder.value.status === OrderStatuses.EXPIRED
              ? 'Awaiting payment'
              : 'Summary confirmed'
          )
        : 'Order confirmed',
      description: paymentIsCard
        ? (
            resolvedOrder.value.status === OrderStatuses.AWAITING_PAYMENT
              ? 'Waiting for customer payment confirmation.'
              : resolvedOrder.value.status === OrderStatuses.EXPIRED
                ? 'Checkout session expired before payment completed.'
                : `Payment status: ${formatLabel(resolvedOrder.value.status)}`
          )
        : 'Cash order accepted and ready for shipment handling.',
      occurredAt: paymentIsCard
        ? paymentConfirmedAt.value ?? paymentExpiredAt.value
        : resolvedOrder.value.created_at,
      state: currentStageKey.value === 'payment'
        ? (resolvedOrder.value.status === OrderStatuses.EXPIRED ? 'failed' : 'current')
        : (
            paymentIsCard
              ? [OrderStatuses.PAID, OrderStatuses.COMPLETED, OrderStatuses.CANCELED, OrderStatuses.REFUNDED, OrderStatuses.ARCHIVED].includes(resolvedOrder.value.status)
              : true
          )
            ? 'completed'
            : 'upcoming',
      icon: 'payment',
    })

    items.push({
      key: 'created',
      title: 'Order created',
      description: `${formatLabel(resolvedOrder.value.payment.type)} payment order was created.`,
      occurredAt: resolvedOrder.value.created_at,
      state: 'completed',
      icon: 'orders',
    })

    if (refundRequestedAt.value && resolvedOrder.value.payment.refund_status === 'pending') {
      items.unshift({
        key: 'refund_requested',
        title: 'Refund requested',
        description: 'Refund request is pending review or processor completion.',
        occurredAt: refundRequestedAt.value,
        state: 'current',
        icon: 'refund',
      })
    }

    return items
  })

  return computed<TimelineItem[]>(() => milestones.value.map(milestone => ({
    key: milestone.key,
    title: milestone.title,
    description: milestone.description,
    icon: milestone.icon,
    state: milestone.state,
    badge: milestone.badge,
    meta: metaLabel(milestone),
  })))
}
