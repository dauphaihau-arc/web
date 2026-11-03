import {
  ShipmentLabelStatuses,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import { shipmentCarrierName } from './shipments.presentation';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

export type RefundableCanceledLabel = {
  shipmentId: string
  labelPublicId: string
  service: string
  priceMinor: number
  currency: string
  carrierName?: string
};

/**
 * A canceled or refunded order keeps the labels it already bought. The seller
 * can still refund the charge for an unused label, but the regular shipment
 * row hides voided consignments, so these labels need their own surface.
 */
const CANCELED_ORDER_STATUSES: OrderStatuses[] = [
  OrderStatuses.CANCELED,
  OrderStatuses.REFUNDED,
];

/**
 * Labels worth refunding on a closed order: purchased, and never scanned by the
 * carrier. A carrier scan consumes the purchase even when the parcel is later
 * returned, so those labels are not listed.
 */
export function refundableCanceledLabels(order: ShopOrder): RefundableCanceledLabel[] {
  if (!CANCELED_ORDER_STATUSES.includes(order.status)) {
    return [];
  }

  const labels: RefundableCanceledLabel[] = [];

  for (const group of order.fulfillment.groups) {
    for (const shipment of group.shipments) {
      const label = shipment.label;

      if (!label || label.status !== ShipmentLabelStatuses.PURCHASED) {
        continue;
      }

      if (shipment.updates.some(update => update.source === ShipmentUpdateSources.CARRIER)) {
        continue;
      }

      const entry: RefundableCanceledLabel = {
        shipmentId: shipment.id,
        labelPublicId: label.public_id,
        service: label.service,
        priceMinor: label.price_minor,
        currency: label.currency,
      };

      const carrierName = shipmentCarrierName(shipment);
      if (carrierName) {
        entry.carrierName = carrierName;
      }

      labels.push(entry);
    }
  }

  return labels;
}
