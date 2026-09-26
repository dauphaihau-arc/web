import dayjs from 'dayjs';
import { ShipmentJourneyStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

export function formatShipmentTimestamp(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  return dayjs(value).format('MMM D, YYYY [at] h:mm A');
}

export function formatShipmentDate(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  return dayjs(value).format('MMM D, YYYY');
}

export function shipmentStatusTone(status: ShipmentStatuses): 'green' | 'blue' | 'yellow' | 'gray' {
  switch (status) {
    case ShipmentStatuses.DELIVERED:
      return 'green';
    case ShipmentStatuses.IN_TRANSIT:
    case ShipmentStatuses.DISPATCHED:
      return 'blue';
    case ShipmentStatuses.PREPARED:
      return 'yellow';
    case ShipmentStatuses.VOIDED:
    default:
      return 'gray';
  }
}

const JOURNEY_PRESENTATION: Record<
  ShipmentJourneyStatuses,
  { label: string, icon: string }
> = {
  [ShipmentJourneyStatuses.DISPATCHED]: {
    label: 'Dispatch',
    icon: 'i-heroicons-arrow-up-on-square-20-solid',
  },
  [ShipmentJourneyStatuses.IN_TRANSIT]: {
    label: 'Mark in transit',
    icon: 'i-heroicons-truck-20-solid',
  },
  [ShipmentJourneyStatuses.DELIVERED]: {
    label: 'Mark delivered',
    icon: 'i-heroicons-check-circle-20-solid',
  },
};

export function journeyLabel(status: ShipmentJourneyStatuses): string {
  return JOURNEY_PRESENTATION[status].label;
}

export function journeyIcon(status: ShipmentJourneyStatuses): string {
  return JOURNEY_PRESENTATION[status].icon;
}

type ShopOrderGroup = ShopOrder['fulfillment']['groups'][number];
type ShipmentView = ShopOrderGroup['shipments'][number];

/** Voided preparation is retained as history but never actionable. */
export function activeShipments(group: ShopOrderGroup): ShipmentView[] {
  return group.shipments.filter(
    shipment => shipment.status !== ShipmentStatuses.VOIDED,
  );
}

/**
 * Remaining quantity a group can still prepare per Order Item: the assigned
 * quantity minus every other active (prepared or dispatched) consignment. Voided
 * and excluded consignments release their capacity.
 */
export function remainingCapacityByItem(
  group: ShopOrderGroup,
  excludeShipmentId?: string,
): Map<string, number> {
  const remaining = new Map<string, number>();

  for (const item of group.items) {
    remaining.set(item.order_item_id, item.quantity);
  }

  for (const shipment of activeShipments(group)) {
    if (shipment.id === excludeShipmentId) {
      continue;
    }

    for (const item of shipment.items) {
      remaining.set(
        item.order_item_id,
        (remaining.get(item.order_item_id) ?? 0) - item.quantity,
      );
    }
  }

  return remaining;
}

export function remainingCapacityTotal(
  group: ShopOrderGroup,
  excludeShipmentId?: string,
): number {
  let total = 0;

  for (const quantity of remainingCapacityByItem(group, excludeShipmentId).values()) {
    total += Math.max(0, quantity);
  }

  return total;
}


/**
 * Quantity a consignment may carry: a whole number, never below zero, never
 * above the capacity the group still holds.
 */
export function clampShipmentQuantity(value: number | undefined, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(value ?? 0), max));
}

/** The timestamp that matches the Shipment's current status, never a stale one. */
export function shipmentStatusTimestamp(
  shipment: ShipmentView,
): string | Date | undefined {
  switch (shipment.status) {
    case ShipmentStatuses.DELIVERED:
      return shipment.delivered_at ?? shipment.dispatched_at ?? shipment.prepared_at;
    case ShipmentStatuses.IN_TRANSIT:
    case ShipmentStatuses.DISPATCHED:
      return shipment.dispatched_at ?? shipment.prepared_at;
    case ShipmentStatuses.VOIDED:
      return shipment.voided_at ?? shipment.prepared_at;
    case ShipmentStatuses.PREPARED:
    default:
      return shipment.prepared_at;
  }
}
