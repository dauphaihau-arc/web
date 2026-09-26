import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { OrderStatuses } from '@arc/enums/order';
import { ShipmentJourneyStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

const SHIPMENT_BLOCKED_ORDER_STATUSES = [
  OrderStatuses.CHECKOUT_PENDING,
  OrderStatuses.CANCELED,
  OrderStatuses.REFUNDED,
  OrderStatuses.EXPIRED,
  OrderStatuses.ARCHIVED,
  OrderStatuses.AWAITING_PAYMENT,
];

export function useOrderShipmentState(
  orderSource: MaybeRefOrGetter<ShopOrder | undefined>,
  shipmentSource: MaybeRefOrGetter<{ status: ShipmentStatuses } | undefined>,
) {
  const order = computed(() => toValue(orderSource));
  const shipment = computed(() => toValue(shipmentSource));

  const shipmentUpdatesBlocked = computed(() =>
    !!order.value && SHIPMENT_BLOCKED_ORDER_STATUSES.includes(order.value.status),
  );

  const allowedJourneyTransitions = computed<ShipmentJourneyStatuses[]>(() => {
    if (!shipment.value || shipmentUpdatesBlocked.value) return [];

    switch (shipment.value.status) {
      case ShipmentStatuses.PREPARED:
        return [ShipmentJourneyStatuses.DISPATCHED];
      case ShipmentStatuses.DISPATCHED:
        return [ShipmentJourneyStatuses.IN_TRANSIT, ShipmentJourneyStatuses.DELIVERED];
      case ShipmentStatuses.IN_TRANSIT:
        return [ShipmentJourneyStatuses.DELIVERED];
      case ShipmentStatuses.DELIVERED:
      case ShipmentStatuses.VOIDED:
      default:
        return [];
    }
  });

  const canEditShipmentInfo = computed(() =>
    !shipmentUpdatesBlocked.value && shipment.value?.status === ShipmentStatuses.PREPARED,
  );

  const canVoidShipment = computed(() =>
    !shipmentUpdatesBlocked.value && shipment.value?.status === ShipmentStatuses.PREPARED,
  );

  function canTransitionTo(status: ShipmentJourneyStatuses) {
    return allowedJourneyTransitions.value.includes(status);
  }

  return {
    allowedJourneyTransitions,
    canEditShipmentInfo,
    canVoidShipment,
    canTransitionTo,
    shipmentUpdatesBlocked,
  };
}
