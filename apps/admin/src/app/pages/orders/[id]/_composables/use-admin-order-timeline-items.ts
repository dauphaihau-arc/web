import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract';
import type { TimelineItem } from '@arc/ui/patterns/timeline.vue';
import { formatOrderDateTime, formatOrderStatusLabel } from '~/domains/orders/utils/order-presentation';

/**
 * The admin detail payload exposes timestamps and the current projections, not
 * a separate event feed. The tracking view therefore states exactly those
 * facts rather than inventing transitions the server never reported.
 */
export function useAdminOrderTimelineItems(order: MaybeRefOrGetter<AdminOrderDetailOrder | undefined>) {
  const resolvedOrder = computed(() => toValue(order));

  return computed<TimelineItem[]>(() => {
    const value = resolvedOrder.value;

    if (!value) {
      return [];
    }

    const items: TimelineItem[] = [
      {
        key: 'created',
        title: 'Order created',
        description: `${formatOrderStatusLabel(value.payment.type)} payment order placed with ${value.shop.shop_name}.`,
        date: formatOrderDateTime(value.created_at),
        icon: 'orderCreated',
        state: 'completed',
      },
      {
        key: 'status',
        title: `Status: ${formatOrderStatusLabel(value.status)}`,
        description: 'Current order status as recorded on the platform.',
        icon: 'orders',
        state: 'active',
      },
      {
        key: 'fulfillment',
        title: `Fulfillment: ${formatOrderStatusLabel(value.fulfillment.status)}`,
        description: `${value.fulfillment.progress.delivered} of ${value.fulfillment.progress.ordered} items delivered.`,
        icon: 'shipping',
        state: value.fulfillment.progress.outstanding > 0 ? 'active' : 'completed',
      },
    ];

    if (value.canceled_at) {
      items.push({
        key: 'canceled',
        title: 'Order canceled',
        description: value.cancel_reason || 'Canceled by an operator.',
        date: formatOrderDateTime(value.canceled_at),
        icon: 'close',
        state: 'failed',
      });
    }

    if (value.refunded_at) {
      items.push({
        key: 'refunded',
        title: 'Refund recorded',
        description: 'A refund against this order was recorded by an operator.',
        date: formatOrderDateTime(value.refunded_at),
        icon: 'refund',
        state: 'completed',
      });
    }

    return items;
  });
}
