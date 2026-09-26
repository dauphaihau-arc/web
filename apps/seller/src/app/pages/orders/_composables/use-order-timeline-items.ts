import dayjs from 'dayjs';
import { OrderStatuses, PaymentTypes } from '@arc/enums/order';
import { ShipmentStatuses } from '@arc/enums/fulfillment';
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants';
import type { TimelineItem } from '@arc/ui/primitives/timeline.vue';
import type { ShopOrder, ShopOrderTimelineEvent } from '~/domains/shop/order/types/shop-order-detail';

type OrderTimelineMilestone = TimelineItem & {
  occurredAt?: Date
  icon: AppIconAlias
};

function formatLabel(value?: string | null) {
  if (!value) {
    return '';
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function metaLabel(milestone: { occurredAt?: Date }) {
  return milestone.occurredAt
    ? dayjs(milestone.occurredAt).format('MMM D, YYYY, h:mm A')
    : '';
}

export function useOrderTimelineItems(order: MaybeRefOrGetter<ShopOrder>, timeline: MaybeRefOrGetter<ShopOrderTimelineEvent[]>) {
  const resolvedOrder = computed(() => toValue(order));
  const resolvedTimeline = computed(() => toValue(timeline));

  function findEvent(type: ShopOrderTimelineEvent['type']) {
    return resolvedTimeline.value.find(event => event.type === type);
  }

  const paymentConfirmedAt = computed(() => findEvent('payment_succeeded')?.occurred_at);
  const paymentExpiredAt = computed(() => findEvent('payment_expired')?.occurred_at);
  const refundRequestedAt = computed(() => findEvent('refund_requested')?.occurred_at);

  const milestones = computed<OrderTimelineMilestone[]>(() => {
    const items: OrderTimelineMilestone[] = [];
    const paymentIsCard = resolvedOrder.value.payment.type === PaymentTypes.CARD;
    const isLegacy = resolvedOrder.value.fulfillment.groups.length === 0;
    const legacy = resolvedOrder.value.fulfillment.legacy_shipping;

    items.push({
      key: 'created',
      title: 'Order created',
      description: `${formatLabel(resolvedOrder.value.payment.type)} payment order was created.`,
      occurredAt: resolvedOrder.value.created_at,
      state: 'completed',
      icon: 'orders',
    });

    items.push({
      key: 'payment',
      title: paymentIsCard
        ? (
          resolvedOrder.value.status === OrderStatuses.AWAITING_PAYMENT
          || resolvedOrder.value.status === OrderStatuses.EXPIRED
            ? 'Awaiting payment'
            : 'Payment confirmed'
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
      state: paymentIsCard && resolvedOrder.value.status === OrderStatuses.EXPIRED
        ? 'failed'
        : 'completed',
      icon: 'payment',
    });

    if (isLegacy) {
      if (legacy.shipped_at) {
        items.push({
          key: 'legacy_shipped',
          title: 'Shipped',
          description: buildLegacyShippingDescription(legacy),
          occurredAt: legacy.shipped_at,
          state: legacy.delivered_at ? 'completed' : 'current',
          icon: 'shipping',
        });
      }

      if (legacy.delivered_at) {
        items.push({
          key: 'legacy_delivered',
          title: 'Delivered',
          description: buildLegacyShippingDescription(legacy),
          occurredAt: legacy.delivered_at,
          state: 'current',
          icon: 'delivered',
        });
      }
    }
    else {
      const shipmentUpdateEvents = resolvedOrder.value.fulfillment.groups
        .flatMap(group =>
          group.shipments.flatMap(shipment =>
            shipment.updates.map(update => ({
              key: `shipment-${shipment.id}-update-${update.id}`,
              title: shipmentUpdateTitle(update.status),
              description: shipmentUpdateDescription(update, shipment),
              occurredAt: new Date(update.occurred_at),
              icon: shipmentUpdateIcon(update.status),
            })),
          ),
        )
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

      for (const event of shipmentUpdateEvents) {
        items.push({
          ...event,
          state: 'completed',
        });
      }

      const activeShipment = resolvedOrder.value.fulfillment.groups
        .flatMap(group => group.shipments)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

      if (activeShipment) {
        const currentKey = `shipment-${activeShipment.id}-${activeShipment.status}`;
        const existing = items.find(item => item.key === currentKey);
        if (existing) {
          existing.state = 'current';
        }
        else if (activeShipment.status === ShipmentStatuses.VOIDED) {
          items.push({
            key: currentKey,
            title: 'Shipment voided',
            description: 'A prepared shipment was voided.',
            occurredAt: activeShipment.voided_at,
            state: 'current',
            icon: 'xCircle',
          });
        }
      }
    }

    if (refundRequestedAt.value && resolvedOrder.value.payment.refund_status === 'pending') {
      items.push({
        key: 'refund_requested',
        title: 'Refund requested',
        description: 'Refund request is pending review or processor completion.',
        occurredAt: refundRequestedAt.value,
        state: 'current',
        icon: 'refund',
      });
    }

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
      });
    }
    else if (
      resolvedOrder.value.status === OrderStatuses.CANCELED
      || resolvedOrder.value.status === OrderStatuses.EXPIRED
      || resolvedOrder.value.status === OrderStatuses.ARCHIVED
    ) {
      items.push({
        key: 'canceled',
        title: resolvedOrder.value.status === OrderStatuses.EXPIRED ? 'Summary expired' : 'Order canceled',
        description: resolvedOrder.value.cancel_reason ??
          (resolvedOrder.value.status === OrderStatuses.EXPIRED
            ? 'Checkout session expired before payment completed.'
            : 'This order is no longer active.'),
        occurredAt: resolvedOrder.value.canceled_at ?? paymentExpiredAt.value,
        state: resolvedOrder.value.status === OrderStatuses.EXPIRED ? 'failed' : 'current',
        icon: resolvedOrder.value.status === OrderStatuses.EXPIRED
          ? 'expired'
          : 'xCircle',
      });
    }

    return items;
  });

  return computed<TimelineItem[]>(() => milestones.value.map(milestone => ({
    key: milestone.key,
    title: milestone.title,
    description: milestone.description,
    icon: milestone.icon,
    state: milestone.state,
    badge: milestone.badge,
    meta: metaLabel(milestone),
  })));
}

function buildLegacyShippingDescription(legacy: ShopOrder['fulfillment']['legacy_shipping']) {
  const parts = [
    legacy.carrier ? `Carrier: ${legacy.carrier}` : '',
    legacy.tracking_number ? `Tracking: ${legacy.tracking_number}` : '',
    legacy.note ?? '',
  ].filter(Boolean);

  return parts.join(' • ') || 'Legacy fulfillment record.';
}

function shipmentUpdateTitle(status: ShipmentStatuses) {
  switch (status) {
    case ShipmentStatuses.PREPARED:
      return 'Shipment prepared';
    case ShipmentStatuses.DISPATCHED:
      return 'Shipment dispatched';
    case ShipmentStatuses.IN_TRANSIT:
      return 'Shipment in transit';
    case ShipmentStatuses.DELIVERED:
      return 'Shipment delivered';
    case ShipmentStatuses.VOIDED:
      return 'Shipment voided';
    default:
      return 'Shipment updated';
  }
}

function shipmentUpdateIcon(status: ShipmentStatuses): AppIconAlias {
  switch (status) {
    case ShipmentStatuses.DELIVERED:
      return 'delivered';
    case ShipmentStatuses.IN_TRANSIT:
      return 'transit';
    case ShipmentStatuses.DISPATCHED:
      return 'shipping';
    case ShipmentStatuses.VOIDED:
      return 'xCircle';
    case ShipmentStatuses.PREPARED:
    default:
      return 'shipping';
  }
}

function shipmentUpdateDescription(
  update: ShopOrder['fulfillment']['groups'][number]['shipments'][number]['updates'][number],
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number],
) {
  const parts = [
    `By ${update.actor_type}`,
    `via ${update.source}`,
    shipment.carrier ? `Carrier: ${shipment.carrier}` : '',
    shipment.tracking_number ? `Tracking: ${shipment.tracking_number}` : '',
    update.note ?? '',
  ].filter(Boolean);

  return parts.join(' • ');
}
