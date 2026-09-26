import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import type { FilterOption } from '~/shared/ui/data-filter/types';

export const orderStatusFilterOptions: FilterOption[] = [
  { label: 'Awaiting payment', value: OrderStatuses.AWAITING_PAYMENT },
  { label: 'Pending', value: OrderStatuses.PENDING },
  { label: 'Paid', value: OrderStatuses.PAID },
  { label: 'Refunded', value: OrderStatuses.REFUNDED },
  { label: 'Completed', value: OrderStatuses.COMPLETED },
  { label: 'Canceled', value: OrderStatuses.CANCELED },
  { label: 'Expired', value: OrderStatuses.EXPIRED },
  { label: 'Archived', value: OrderStatuses.ARCHIVED },
];

export const orderStatusTabOptions = orderStatusFilterOptions.filter(option =>
  [
    OrderStatuses.PAID,
    OrderStatuses.REFUNDED,
    OrderStatuses.COMPLETED,
    OrderStatuses.CANCELED,
  ].includes(option.value as OrderStatuses),
);

export const orderFulfillmentFilterOptions: FilterOption[] = [
  { label: 'Unfulfilled', value: FulfillmentAggregateStatuses.UNFULFILLED },
  { label: 'Prepared', value: FulfillmentAggregateStatuses.PREPARED },
  { label: 'Partially shipped', value: FulfillmentAggregateStatuses.PARTIALLY_SHIPPED },
  { label: 'Shipped', value: FulfillmentAggregateStatuses.SHIPPED },
  { label: 'Partially delivered', value: FulfillmentAggregateStatuses.PARTIALLY_DELIVERED },
  { label: 'Delivered', value: FulfillmentAggregateStatuses.DELIVERED },
  { label: 'Canceled', value: FulfillmentAggregateStatuses.CANCELED },
  // Legacy order-level projection values retained for pre-cutover Orders.
  { label: 'Dispatched (legacy)', value: FulfillmentAggregateStatuses.DISPATCHED },
  { label: 'In transit (legacy)', value: FulfillmentAggregateStatuses.IN_TRANSIT },
];
