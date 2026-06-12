import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order';
import type { FilterOption } from '~/app/components/filter/types';

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
  ].includes(option.value as OrderStatuses)
);

export const orderFulfillmentFilterOptions: FilterOption[] = [
  { label: 'Pre transit', value: OrderShippingStatuses.PRE_TRANSIT },
  { label: 'In transit', value: OrderShippingStatuses.IN_TRANSIT },
  { label: 'Shipped', value: OrderShippingStatuses.SHIPPED },
  { label: 'Delivered', value: OrderShippingStatuses.DELIVERED },
];
