import dayjs from 'dayjs';
import {
  ShipmentStatuses, ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import { carrierEventLabel } from '@arc/utils';
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

type ShopOrderGroup = ShopOrder['fulfillment']['groups'][number];
type ShipmentView = ShopOrderGroup['shipments'][number];
type ShipmentUpdateView = ShipmentView['updates'][number];

/** Carrier wording wins over the free-form note and the plain status label. */
export function shipmentUpdateTitle(update: ShipmentUpdateView): string {
  return carrierEventLabel(update.event_code) || update.note?.trim() || shipmentStatusLabel(update.status);
}

export function shipmentStatusLabel(status: ShipmentStatuses): string {
  return status.replaceAll('_', ' ');
}

/**
 * Carrier scans for the tracking dialog, newest first. Seller and system
 * evidence (preparation, amendments, voids) stays in the consignment history
 * rather than masquerading as a scan.
 */
export function shipmentCarrierEventUpdates(shipment: ShipmentView): ShipmentUpdateView[] {
  return shipment.updates
    .filter(update => update.source === ShipmentUpdateSources.CARRIER)
    .sort((left, right) =>
      dayjs(right.occurred_at).valueOf() - dayjs(left.occurred_at).valueOf());
}

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

/**
 * The seller-facing reason a typed quantity cannot be shipped, if any. The
 * dialogs disable their primary action on this so the quantity a seller sees is
 * the quantity the request carries.
 */
export function shipmentQuantityError(
  value: number | undefined,
  max: number,
): string | undefined {
  if (!Number.isFinite(value) || !Number.isInteger(value) || (value ?? 0) < 0) {
    return `Enter a whole number between 0 and ${max}.`;
  }

  if ((value ?? 0) > max) {
    return `Only ${max} remaining.`;
  }

  return undefined;
}

/** The server-resolved display name, falling back to the stored carrier code. */
export function shipmentCarrierName(shipment: ShipmentView): string | undefined {
  return shipment.carrier_name ?? shipment.carrier;
}

/**
 * A tracking number is unverified when the carrier cannot report events; a
 * missing tracking number has nothing to verify.
 */
export function shipmentTrackingUnverified(shipment: ShipmentView): boolean {
  return shipment.carrier_observable === false && Boolean(shipment.tracking_number?.trim());
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
