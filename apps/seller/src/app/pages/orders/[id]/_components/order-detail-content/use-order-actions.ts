import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { OrderStatuses, PaymentTypes } from '@arc/enums/order';
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

const NOTHING_DISPATCHED_STATUSES = [
  FulfillmentAggregateStatuses.UNFULFILLED,
  FulfillmentAggregateStatuses.PREPARED,
];

export function useOrderActions(orderSource: MaybeRefOrGetter<ShopOrder | undefined>) {
  const order = computed(() => toValue(orderSource));

  const canRefund = computed(() =>
    !!order.value
    && order.value.payment.type === PaymentTypes.CARD
    && [undefined, 'failed'].includes(order.value.payment.refund_status)
    && (
      (order.value.status === OrderStatuses.PAID && hasDispatchedQuantities(order.value))
      || order.value.status === OrderStatuses.COMPLETED
    ),
  );

  const canCancel = computed(() =>
    !!order.value
    && [OrderStatuses.PAID, OrderStatuses.PENDING].includes(order.value.status)
    && nothingHasBeenDispatched(order.value),
  );

  const canRetryRefund = computed(() =>
    !!order.value
    && order.value.payment.type === PaymentTypes.CARD
    && order.value.payment.refund_status === 'failed'
    && [OrderStatuses.CANCELED, OrderStatuses.PAID, OrderStatuses.COMPLETED].includes(order.value.status),
  );

  return {
    canCancel,
    canRefund,
    canRetryRefund,
  };
}

function hasLegacyOrderShipping(order: ShopOrder): boolean {
  return order.fulfillment.groups.length === 0;
}

function hasDispatchedQuantities(order: ShopOrder): boolean {
  if (hasLegacyOrderShipping(order)) {
    return order.fulfillment.legacy_shipping.status !== 'pre_transit';
  }

  return !NOTHING_DISPATCHED_STATUSES.includes(order.fulfillment.status);
}

function nothingHasBeenDispatched(order: ShopOrder): boolean {
  return !hasDispatchedQuantities(order);
}
