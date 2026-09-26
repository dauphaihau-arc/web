import { ShipmentStatuses } from '@arc/enums/fulfillment';
import { describe, expect, it } from 'vitest';
import {
  activeShipments,
  clampShipmentQuantity,
  remainingCapacityByItem,
  remainingCapacityTotal,
} from './shipments.presentation';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

type Group = ShopOrder['fulfillment']['groups'][number];
type Shipment = Group['shipments'][number];
type GroupItem = Group['items'][number];

function buildShipment(input: {
  id: string
  status: ShipmentStatuses
  items: GroupItem[]
}): Shipment {
  return {
    id: input.id,
    group_id: 'group-1',
    status: input.status,
    origin_countries: [],
    prepared_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: input.items,
    updates: [],
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
