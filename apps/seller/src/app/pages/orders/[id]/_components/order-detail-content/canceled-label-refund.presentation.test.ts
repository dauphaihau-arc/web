import {
  ShipmentLabelStatuses,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import { describe, expect, it } from 'vitest';
import { refundableCanceledLabels } from './canceled-label-refund.presentation';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

type Group = ShopOrder['fulfillment']['groups'][number];
type Shipment = Group['shipments'][number];
type ShipmentLabel = NonNullable<Shipment['label']>;

function buildLabel(overrides: Partial<ShipmentLabel> = {}): ShipmentLabel {
  return {
    public_id: 'label-1',
    service: 'standard',
    status: ShipmentLabelStatuses.PURCHASED,
    price_minor: 1250,
    currency: 'USD',
    ...overrides,
  } as ShipmentLabel;
}

function buildShipment(input: {
  id?: string
  carrier?: string
  carrierName?: string
  label?: ShipmentLabel | null
  updates?: Shipment['updates']
} = {}): Shipment {
  return {
    id: input.id ?? 'shipment-1',
    group_id: 'group-1',
    status: ShipmentStatuses.PREPARED,
    carrier: input.carrier ?? 'usps',
    carrier_name: input.carrierName,
    label: input.label === undefined ? buildLabel() : input.label,
    origin_countries: ['US'],
    prepared_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: [{ order_item_id: 'item-1', quantity: 1 }],
    updates: input.updates ?? [],
  } as unknown as Shipment;
}

function buildOrder(
  status: OrderStatuses,
  shipments: Shipment[],
): ShopOrder {
  return {
    id: 'order-1',
    status,
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: 'canceled',
      requires_reconciliation: false,
      progress: {
        ordered: 1, prepared: 0, dispatched: 0, delivered: 0, canceled: 1, outstanding: 0,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: 1 }],
          progress: {
            ordered: 1, prepared: 0, dispatched: 0, delivered: 0, canceled: 1, outstanding: 0,
          },
          shipments,
        } as unknown as Group,
      ],
    },
  } as unknown as ShopOrder;
}

function carrierScan(): Shipment['updates'] {
  return [{
    id: 'update-1',
    status: ShipmentStatuses.IN_TRANSIT,
    actor_type: ShipmentUpdateActorTypes.CARRIER,
    actor_id: 'usps',
    source: ShipmentUpdateSources.CARRIER,
    occurred_at: new Date('2026-10-31T09:00:00.000Z'),
    event_code: 'IN_TRANSIT',
  }] as unknown as Shipment['updates'];
}

describe('refundableCanceledLabels', () => {
  it('lists an unused purchased label on a canceled order', () => {
    const order = buildOrder(OrderStatuses.CANCELED, [
      buildShipment({ carrierName: 'USPS' }),
    ]);

    expect(refundableCanceledLabels(order)).toEqual([{
      shipmentId: 'shipment-1',
      labelPublicId: 'label-1',
      service: 'standard',
      priceMinor: 1250,
      currency: 'USD',
      carrierName: 'USPS',
    }]);
  });

  it('lists an unused purchased label on a refunded order', () => {
    const order = buildOrder(OrderStatuses.REFUNDED, [buildShipment()]);

    expect(refundableCanceledLabels(order)).toHaveLength(1);
  });

  it('omits a label the carrier already scanned', () => {
    const order = buildOrder(OrderStatuses.CANCELED, [
      buildShipment({ updates: carrierScan() }),
    ]);

    expect(refundableCanceledLabels(order)).toEqual([]);
  });

  it('omits shipments without a label', () => {
    const order = buildOrder(OrderStatuses.CANCELED, [
      buildShipment({ label: null }),
    ]);

    expect(refundableCanceledLabels(order)).toEqual([]);
  });

  it('omits labels that are already voided or used', () => {
    const order = buildOrder(OrderStatuses.CANCELED, [
      buildShipment({ id: 'shipment-voided', label: buildLabel({ status: ShipmentLabelStatuses.VOIDED }) }),
      buildShipment({ id: 'shipment-used', label: buildLabel({ status: ShipmentLabelStatuses.USED }) }),
    ]);

    expect(refundableCanceledLabels(order)).toEqual([]);
  });

  it('ignores orders that are not canceled or refunded', () => {
    const order = buildOrder(OrderStatuses.COMPLETED, [buildShipment()]);

    expect(refundableCanceledLabels(order)).toEqual([]);
  });

  it('falls back to the carrier code when no display name is resolved', () => {
    const order = buildOrder(OrderStatuses.CANCELED, [buildShipment({ carrier: 'dhl' })]);

    expect(refundableCanceledLabels(order)[0]?.carrierName).toBe('dhl');
  });
});
