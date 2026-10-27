import dayjs from 'dayjs';
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import { formatMinorCurrency } from '@arc/utils';
import type {
  AdminOrderDetailOrder,
  AdminOrderRefundAction,
} from '../api/contracts/admin-orders.contract';

export type StatusTone = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

/**
 * The statuses an operator may force through the admin status endpoint. The API
 * rejects every other value, so the dialog only offers these.
 */
export const ADMIN_ORDER_ACTION_STATUSES = [
  OrderStatuses.CANCELED,
  OrderStatuses.REFUNDED,
  OrderStatuses.ARCHIVED,
] as const;

export type AdminOrderActionStatus = (typeof ADMIN_ORDER_ACTION_STATUSES)[number];

export function isAdminOrderActionStatus(value: string): value is AdminOrderActionStatus {
  return (ADMIN_ORDER_ACTION_STATUSES as readonly string[]).includes(value);
}

export const ADMIN_ORDER_REFUND_ACTION_OPTIONS: Array<{
  label: string
  value: AdminOrderRefundAction
}> = [
  { label: 'Retry refund', value: 'retry' },
  { label: 'Mark refund as succeeded', value: 'mark_succeeded' },
  { label: 'Mark refund as failed', value: 'mark_failed' },
  { label: 'Mark refund not required', value: 'mark_not_required' },
];

export function isAdminOrderRefundAction(value: string): value is AdminOrderRefundAction {
  return ADMIN_ORDER_REFUND_ACTION_OPTIONS.some(option => option.value === value);
}

export function formatOrderStatusLabel(status?: string) {
  if (!status) {
    return '';
  }

  return status
    .replaceAll('_', ' ')
    .replace(/\b[a-z]/g, character => character.toUpperCase());
}

export const ADMIN_ORDER_STATUS_OPTIONS = Object.values(OrderStatuses).map(
  status => ({
    label: formatOrderStatusLabel(status),
    value: status,
  }),
);

export function formatOrderDate(value?: string) {
  return value ? dayjs(value).format('MMM D, YYYY') : '';
}

export function formatOrderDateTime(value?: string) {
  return value ? dayjs(value).format('MMM D, YYYY, h:mm A') : '';
}

export function formatOrderAmount(amountMinor?: number, currency?: string) {
  return formatMinorCurrency(amountMinor, currency);
}

/**
 * The refund lifecycle lives on the stored payment details because the refund
 * endpoints only return the order; the admin refund dialog surfaces it as-is
 * and never infers a state the server did not report.
 */
export function readRefundStatus(order: AdminOrderDetailOrder): string | undefined {
  const value = order.payment.details?.['refund_status'];

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function orderStatusTone(status?: string): StatusTone {
  switch (status) {
    case OrderStatuses.PAID:
    case OrderStatuses.COMPLETED:
      return 'green';
    case OrderStatuses.PENDING:
    case OrderStatuses.CHECKOUT_PENDING:
    case OrderStatuses.AWAITING_PAYMENT:
      return 'yellow';
    case OrderStatuses.CANCELED:
    case OrderStatuses.REFUNDED:
    case OrderStatuses.EXPIRED:
      return 'red';
    case OrderStatuses.ARCHIVED:
    default:
      return 'gray';
  }
}

export function fulfillmentStatusTone(status?: string): StatusTone {
  switch (status) {
    case FulfillmentAggregateStatuses.DELIVERED:
      return 'green';
    case FulfillmentAggregateStatuses.PARTIALLY_DELIVERED:
    case FulfillmentAggregateStatuses.PARTIALLY_SHIPPED:
    case FulfillmentAggregateStatuses.PREPARED:
      return 'yellow';
    case FulfillmentAggregateStatuses.SHIPPED:
    case FulfillmentAggregateStatuses.DISPATCHED:
    case FulfillmentAggregateStatuses.IN_TRANSIT:
      return 'blue';
    case FulfillmentAggregateStatuses.CANCELED:
      return 'red';
    case FulfillmentAggregateStatuses.UNFULFILLED:
    default:
      return 'gray';
  }
}
