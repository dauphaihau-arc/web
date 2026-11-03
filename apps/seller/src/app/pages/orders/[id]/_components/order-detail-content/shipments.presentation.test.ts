import {
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import { describe, expect, it } from 'vitest';
import {
  activeShipments,
  clampShipmentQuantity,
  remainingCapacityByItem,
  remainingCapacityTotal,
  shipmentCarrierEventUpdates,
  shipmentCarrierName,
  shipmentQuantityError,
  shipmentTrackingUnverified,
  shipmentUpdateTitle,
} from './shipments.presentation';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

type Group = ShopOrder['fulfillment']['groups'][number];
type Shipment = Group['shipments'][number];
type GroupItem = Group['items'][number];

function buildShipment(input: {
  id: string
  status: ShipmentStatuses
  items: GroupItem[]
  carrier?: string
  carrierName?: string
  carrierObservable?: boolean
  trackingNumber?: string
  updates?: Shipment['updates']
}): Shipment {
  return {
    id: input.id,
    group_id: 'group-1',
    status: input.status,
    carrier: input.carrier,
    carrier_name: input.carrierName,
    carrier_observable: input.carrierObservable,
    tracking_number: input.trackingNumber,
    origin_countries: [],
    prepared_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: input.items,
    updates: input.updates ?? [],
  } as unknown as Shipment;
}

function buildGroup(items: GroupItem[], shipments: Shipment[]): Group {
  return {
    id: 'group-1',
    method: 'seller',
    operator: 'seller',
    provenance: 'confirmed_order',
    items,
    progress: {
      ordered: items.reduce((total, item) => total + item.quantity, 0),
      prepared: 0,
      dispatched: 0,
      delivered: 0,
      canceled: 0,
      outstanding: 0,
    },
    shipments,
  } as unknown as Group;
}

describe('remainingCapacityByItem', () => {
  const items: GroupItem[] = [{ order_item_id: 'item-1', quantity: 3 }];

  it('subtracts prepared and dispatched quantities', () => {
    const group = buildGroup(items, [
      buildShipment({
        id: 'shipment-1',
        status: ShipmentStatuses.PREPARED,
        items: [{ order_item_id: 'item-1', quantity: 1 }],
      }),
      buildShipment({
        id: 'shipment-2',
        status: ShipmentStatuses.DISPATCHED,
        items: [{ order_item_id: 'item-1', quantity: 1 }],
      }),
    ]);

    expect(remainingCapacityByItem(group).get('item-1')).toBe(1);
    expect(remainingCapacityTotal(group)).toBe(1);
  });

  it('releases capacity held by voided preparation', () => {
    const group = buildGroup(items, [
      buildShipment({
        id: 'shipment-1',
        status: ShipmentStatuses.VOIDED,
        items: [{ order_item_id: 'item-1', quantity: 3 }],
      }),
    ]);

    expect(activeShipments(group)).toHaveLength(0);
    expect(remainingCapacityTotal(group)).toBe(3);
  });

  it('adds back the excluded consignment so it can be amended', () => {
    const group = buildGroup(items, [
      buildShipment({
        id: 'shipment-1',
        status: ShipmentStatuses.PREPARED,
        items: [{ order_item_id: 'item-1', quantity: 2 }],
      }),
    ]);

    expect(remainingCapacityTotal(group, 'shipment-1')).toBe(3);
    expect(remainingCapacityTotal(group)).toBe(1);
  });

  it('reports per-item deficits but clamps the actionable total at zero', () => {
    const group = buildGroup(
      [
        { order_item_id: 'item-1', quantity: 1 },
        { order_item_id: 'item-2', quantity: 2 },
      ],
      [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.PREPARED,
          items: [
            { order_item_id: 'item-1', quantity: 2 },
            { order_item_id: 'item-2', quantity: 1 },
          ],
        }),
      ],
    );

    expect(remainingCapacityByItem(group).get('item-1')).toBe(-1);
    expect(remainingCapacityTotal(group)).toBe(1);
  });
});

describe('clampShipmentQuantity', () => {
  it('keeps a whole quantity inside the consignment capacity', () => {
    expect(clampShipmentQuantity(2.7, 5)).toBe(2);
    expect(clampShipmentQuantity(9, 4)).toBe(4);
  });

  it('treats missing and negative input as nothing to ship', () => {
    expect(clampShipmentQuantity(undefined, 4)).toBe(0);
    expect(clampShipmentQuantity(Number.NaN, 4)).toBe(0);
    expect(clampShipmentQuantity(-3, 4)).toBe(0);
  });

  it('cannot ship anything from a consignment with no capacity left', () => {
    expect(clampShipmentQuantity(3, 0)).toBe(0);
  });
});

describe('shipmentQuantityError', () => {
  it('accepts every quantity the consignment can actually carry', () => {
    expect(shipmentQuantityError(0, 4)).toBeUndefined();
    expect(shipmentQuantityError(4, 4)).toBeUndefined();
  });

  it('names the remaining capacity when the typed quantity is too high', () => {
    expect(shipmentQuantityError(1331, 1)).toBe('Only 1 remaining.');
    expect(shipmentQuantityError(5, 4)).toBe('Only 4 remaining.');
  });

  it('asks for a whole quantity when the entry is blank, fractional or negative', () => {
    expect(shipmentQuantityError(Number.NaN, 4)).toBe('Enter a whole number between 0 and 4.');
    expect(shipmentQuantityError(undefined, 4)).toBe('Enter a whole number between 0 and 4.');
    expect(shipmentQuantityError(2.5, 4)).toBe('Enter a whole number between 0 and 4.');
    expect(shipmentQuantityError(-1, 4)).toBe('Enter a whole number between 0 and 4.');
  });
});

describe('shipmentCarrierName', () => {
  it('prefers the server-resolved carrier name', () => {
    const shipment = buildShipment({
      id: 'shipment-1',
      status: ShipmentStatuses.PREPARED,
      items: [],
      carrier: 'usps',
      carrierName: 'USPS',
    });

    expect(shipmentCarrierName(shipment)).toBe('USPS');
  });

  it('falls back to the stored carrier code', () => {
    const shipment = buildShipment({
      id: 'shipment-1',
      status: ShipmentStatuses.PREPARED,
      items: [],
      carrier: 'usps',
    });

    expect(shipmentCarrierName(shipment)).toBe('usps');
  });

  it('returns nothing when the shipment has no carrier', () => {
    const shipment = buildShipment({
      id: 'shipment-1',
      status: ShipmentStatuses.PREPARED,
      items: [],
    });

    expect(shipmentCarrierName(shipment)).toBeUndefined();
  });
});

describe('shipmentTrackingUnverified', () => {
  it('marks a tracking number from a non-observable carrier as unverified', () => {
    const shipment = buildShipment({
      id: 'shipment-1',
      status: ShipmentStatuses.DISPATCHED,
      items: [],
      carrier: 'other',
      carrierName: 'Other',
      carrierObservable: false,
      trackingNumber: 'TRACK-1',
    });

    expect(shipmentTrackingUnverified(shipment)).toBe(true);
  });

  it('does not mark an observable carrier or a missing tracking number', () => {
    const observable = buildShipment({
      id: 'shipment-1',
      status: ShipmentStatuses.DISPATCHED,
      items: [],
      carrier: 'usps',
      carrierName: 'USPS',
      carrierObservable: true,
      trackingNumber: '9400111899223456789012',
    });
    const withoutTracking = buildShipment({
      id: 'shipment-2',
      status: ShipmentStatuses.PREPARED,
      items: [],
      carrier: 'other',
      carrierObservable: false,
    });

    expect(shipmentTrackingUnverified(observable)).toBe(false);
    expect(shipmentTrackingUnverified(withoutTracking)).toBe(false);
  });
});

function buildUpdate(input: {
  id: string
  source: ShipmentUpdateSources
  occurredAt: Date
  status?: ShipmentStatuses
  eventCode?: string
  note?: string
}): Shipment['updates'][number] {
  return {
    id: input.id,
    status: input.status ?? ShipmentStatuses.IN_TRANSIT,
    actor_type: ShipmentUpdateActorTypes.CARRIER,
    source: input.source,
    occurred_at: input.occurredAt,
    event_code: input.eventCode,
    note: input.note,
  } as unknown as Shipment['updates'][number];
}

describe('shipmentUpdateTitle', () => {
  it('prefers the shared wording for a known carrier scan', () => {
    const update = buildUpdate({
      id: 'update-1',
      source: ShipmentUpdateSources.CARRIER,
      occurredAt: new Date(),
      eventCode: 'out_for_delivery',
      note: 'Should not win',
    });

    expect(shipmentUpdateTitle(update)).toBe('Out for delivery');
  });

  it('falls back to the trimmed note, then the plain status label', () => {
    const noted = buildUpdate({
      id: 'update-1',
      source: ShipmentUpdateSources.SELLER,
      occurredAt: new Date(),
      eventCode: 'EXCEPTION',
      note: '  Handed to carrier  ',
    });
    const bare = buildUpdate({
      id: 'update-2',
      source: ShipmentUpdateSources.SYSTEM,
      occurredAt: new Date(),
      status: ShipmentStatuses.PREPARED,
    });

    expect(shipmentUpdateTitle(noted)).toBe('Handed to carrier');
    expect(shipmentUpdateTitle(bare)).toBe('prepared');
  });
});

describe('shipmentCarrierEventUpdates', () => {
  it('keeps only carrier scans, newest first', () => {
    const shipment = buildShipment({
      id: 'shipment-1',
      status: ShipmentStatuses.IN_TRANSIT,
      items: [],
      updates: [
        buildUpdate({
          id: 'update-prepared',
          source: ShipmentUpdateSources.SELLER,
          occurredAt: new Date(2026, 10, 3, 9, 0),
        }),
        buildUpdate({
          id: 'update-transit',
          source: ShipmentUpdateSources.CARRIER,
          occurredAt: new Date(2026, 9, 31, 9, 0),
          eventCode: 'IN_TRANSIT',
        }),
        buildUpdate({
          id: 'update-returned',
          source: ShipmentUpdateSources.CARRIER,
          occurredAt: new Date(2026, 10, 2, 9, 0),
          eventCode: 'RETURNED',
        }),
      ],
    });

    expect(shipmentCarrierEventUpdates(shipment).map(update => update.id))
      .toEqual(['update-returned', 'update-transit']);
  });
});
