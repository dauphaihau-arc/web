import {
  FulfillmentAggregateStatuses,
  FulfillmentMethods,
  FulfillmentOperators,
  FulfillmentProvenances,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import type { ElementType } from '@arc/contracts/utils';
import { describe, expect, it } from 'vitest';
import type {
  FulfillmentGroup,
  FulfillmentShipment,
  FulfillmentShipmentItem,
  FulfillmentShipmentUpdate,
  GetOrderShopsResponse,
  LegacyOrderShipping,
} from '~/domains/me/api/order/contracts/order.contract';
import {
  buildAwaitingShipmentLines,
  buildOrderPackages,
  buildOrderStages,
  formatPackageCounts,
  orderItemsCount,
  orderPackageStatusText,
  orderPackageTone,
  paymentMethodLabel,
} from './order-detail-presentation';

type OrderShop = ElementType<GetOrderShopsResponse['order_shops']>;
type OrderShopProduct = OrderShop['products'][number];

function buildProduct(input: {
  id: string
  quantity: number
  amountMinor: number
}): OrderShopProduct {
  return {
    id: input.id,
    title: `Product ${input.id}`,
    quantity: input.quantity,
    amount_minor: input.amountMinor,
    promo_discount_minor: 0,
    currency: 'USD',
    product: {
      id: `product-${input.id}`,
      slug: `product-${input.id}`,
      shop: { slug: 'shop' },
      shipping: {},
      selected_options: [],
    },
    inventory: {},
  };
}

function buildUpdate(input: {
  id: string
  status: ShipmentStatuses
  occurredAt: Date
  note?: string
}): FulfillmentShipmentUpdate {
  return {
    id: input.id,
    status: input.status,
    actor_type: ShipmentUpdateActorTypes.SELLER,
    source: ShipmentUpdateSources.SELLER,
    occurred_at: input.occurredAt,
    note: input.note,
  };
}

function buildShipment(input: {
  id: string
  status: ShipmentStatuses
  items?: FulfillmentShipmentItem[]
  carrier?: string
  trackingNumber?: string
  preparedAt?: Date
  dispatchedAt?: Date
  deliveredAt?: Date
  updates?: FulfillmentShipmentUpdate[]
}): FulfillmentShipment {
  const preparedAt = input.preparedAt ?? new Date(2026, 2, 1, 10, 0);

  return {
    id: input.id,
    group_id: `group-${input.id}`,
    status: input.status,
    carrier: input.carrier,
    tracking_number: input.trackingNumber,
    origin_countries: ['US'],
    prepared_at: preparedAt,
    dispatched_at: input.dispatchedAt,
    delivered_at: input.deliveredAt,
    created_at: preparedAt,
    updated_at: preparedAt,
    items: input.items ?? [{ order_item_id: 'item-1', quantity: 1 }],
    updates: input.updates ?? [],
  };
}

function buildGroup(input: {
  id?: string
  shipments: FulfillmentShipment[]
}): FulfillmentGroup {
  const ordered = input.shipments.reduce(
    (total, shipment) => total + shipment.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );

  return {
    id: input.id ?? 'group-1',
    method: FulfillmentMethods.SELLER,
    operator: FulfillmentOperators.SELLER,
    provenance: FulfillmentProvenances.CONFIRMED_ORDER,
    items: input.shipments.flatMap(shipment => shipment.items),
    progress: {
      ordered,
      prepared: ordered,
      dispatched: 0,
      delivered: 0,
      canceled: 0,
      outstanding: 0,
    },
    shipments: input.shipments,
  };
}

function buildLegacy(input: {
  status: string
  trackingNumber?: string
  carrier?: string
  note?: string
  shippedAt?: Date
  deliveredAt?: Date
}): LegacyOrderShipping {
  return {
    status: input.status,
    updated_at: new Date(2026, 2, 1, 10, 0),
    to_country: 'US',
    from_countries: ['US'],
    estimated_delivery: new Date(2026, 2, 10, 10, 0),
    tracking_number: input.trackingNumber,
    carrier: input.carrier,
    note: input.note,
    shipped_at: input.shippedAt,
    delivered_at: input.deliveredAt,
  };
}

function buildOrderShop(input: {
  products: OrderShopProduct[]
  groups?: FulfillmentGroup[]
  legacy?: LegacyOrderShipping
  fulfillmentStatus?: FulfillmentAggregateStatuses
  shippingEstimate?: { earliest: Date, latest: Date, processingTimeMaxDays?: number }
}): OrderShop {
  const ordered = input.products.reduce((total, product) => total + product.quantity, 0);

  return {
    id: 'order-shop-1',
    order_number: '1001',
    shop: { id: 'shop-1', shop_name: 'Shop', slug: 'shop' },
    payment: { type: 'card' },
    status: OrderStatuses.PAID,
    products: input.products,
    promo_codes: [],
    fulfillment: {
      status: input.fulfillmentStatus ?? FulfillmentAggregateStatuses.SHIPPED,
      requires_reconciliation: false,
      progress: {
        ordered,
        prepared: 0,
        dispatched: 0,
        delivered: 0,
        canceled: 0,
        outstanding: ordered,
      },
      groups: input.groups ?? [],
      legacy_shipping: input.legacy ?? buildLegacy({ status: 'pre_transit' }),
    },
    currency: 'USD',
    subtotal_minor: 0,
    shipping_minor: 0,
    discount_minor: 0,
    sale_discount_minor: 0,
    total_minor: 0,
    created_at: new Date(2026, 2, 1, 10, 0),
    shipping: input.shippingEstimate
      ? {
        estimate: {
          earliest_delivery_date: input.shippingEstimate.earliest,
          latest_delivery_date: input.shippingEstimate.latest,
          processing_time_max_days: input.shippingEstimate.processingTimeMaxDays,
        },
      }
      : undefined,
    // The helpers read a fixed subset; unrelated resource fields stay omitted.
  } as unknown as OrderShop;
}

describe('buildOrderPackages', () => {
  it('creates one package per non-voided shipment across groups', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 2, amountMinor: 4000 })],
      groups: [
        buildGroup({
          id: 'group-1',
          shipments: [
            buildShipment({
              id: 'shipment-1',
              status: ShipmentStatuses.DELIVERED,
              deliveredAt: new Date(2026, 9, 27, 12, 0),
            }),
            buildShipment({ id: 'shipment-voided', status: ShipmentStatuses.VOIDED }),
          ],
        }),
        buildGroup({
          id: 'group-2',
          shipments: [buildShipment({ id: 'shipment-2', status: ShipmentStatuses.IN_TRANSIT })],
        }),
      ],
    }));

    expect(summary.packages.map(pkg => ({ id: pkg.id, index: pkg.index, total: pkg.total }))).toEqual([
      { id: 'shipment-1', index: 1, total: 2 },
      { id: 'shipment-2', index: 2, total: 2 },
    ]);
    expect(summary.packages.some(pkg => pkg.id === 'shipment-voided')).toBe(false);
    expect(summary.counts).toEqual({
      total: 2,
      delivered: 1,
      inTransit: 1,
      preparing: 0,
      canceled: 0,
    });
  });

  it('splits a quantity line and its price across packages', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 2, amountMinor: 4800 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.PREPARED,
            items: [{ order_item_id: 'item-1', quantity: 1 }],
          }),
          buildShipment({
            id: 'shipment-2',
            status: ShipmentStatuses.PREPARED,
            items: [{ order_item_id: 'item-1', quantity: 1 }],
          }),
        ],
      })],
    }));

    expect(summary.packages).toHaveLength(2);
    for (const pkg of summary.packages) {
      expect(pkg.lines).toHaveLength(1);
      expect(pkg.lines[0]).toMatchObject({
        orderItemId: 'item-1',
        quantity: 1,
        unitPriceMinor: 2400,
        amountMinor: 2400,
        currency: 'USD',
      });
    }
  });

  it('renders delivered status text from the delivery date', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            deliveredAt: new Date(2026, 9, 27, 12, 0),
          }),
        ],
      })],
    }));

    expect(orderPackageStatusText(summary.packages[0])).toBe('Delivered Oct 27');
  });

  it('renders in-transit status text without the estimate', () => {
    const year = new Date().getUTCFullYear();
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.IN_TRANSIT })],
      })],
      shippingEstimate: {
        earliest: new Date(Date.UTC(year, 10, 2)),
        latest: new Date(Date.UTC(year, 10, 6)),
      },
    }));

    expect(summary.packages[0].estimateDetail).toBe('Est. Nov 2 - 6');
    expect(summary.packages[0].statusDetail).toBe('Mar 01');
    expect(orderPackageStatusText(summary.packages[0])).toBe('In transit');
  });

  it('renders a preparing status without an estimate', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.PREPARED,
            preparedAt: new Date(2026, 2, 1, 10, 0),
          }),
        ],
      })],
    }));

    expect(orderPackageStatusText(summary.packages[0])).toBe('Preparing');
  });

  it('derives tone from the shipment state', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({ id: 'prepared', status: ShipmentStatuses.PREPARED }),
          buildShipment({ id: 'dispatched', status: ShipmentStatuses.DISPATCHED }),
          buildShipment({ id: 'in-transit', status: ShipmentStatuses.IN_TRANSIT }),
          buildShipment({
            id: 'delivered',
            status: ShipmentStatuses.DELIVERED,
            deliveredAt: new Date(2026, 9, 27, 12, 0),
          }),
        ],
      })],
    }));

    expect(summary.packages.map(orderPackageTone)).toEqual(['yellow', 'blue', 'blue', 'green']);
  });
});

describe('package stages', () => {
  it('completes all four stages for a delivered shipment', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            preparedAt: new Date(2026, 2, 1, 10, 0),
            dispatchedAt: new Date(2026, 2, 2, 9, 30),
            deliveredAt: new Date(2026, 9, 27, 12, 0),
          }),
        ],
      })],
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
      },
    }));

    expect(summary.packages[0].stages).toEqual([
      {
        key: 'placed', label: 'Order placed', detail: 'Mar 01, 10:00', complete: true,
      },
      {
        key: 'packed', label: 'Packed', detail: 'Mar 01, 10:00', complete: true,
      },
      {
        key: 'shipped', label: 'Shipped', detail: 'Mar 02, 09:30', complete: true,
      },
      {
        key: 'delivered', label: 'Delivered', detail: 'Oct 27, 12:00', complete: true,
      },
    ]);
    expect(summary.packages[0].statusDetail).toBe('Oct 27');
    expect(orderPackageStatusText(summary.packages[0])).toBe('Delivered Oct 27');
  });

  it('marks an in-transit shipment as shipped with the transit note', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.IN_TRANSIT,
            preparedAt: new Date(2026, 2, 1, 10, 0),
            dispatchedAt: new Date(2026, 2, 2, 9, 30),
          }),
        ],
      })],
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
      },
    }));

    const stages = summary.packages[0].stages;
    expect(stages.map(stage => ({ key: stage.key, complete: stage.complete }))).toEqual([
      { key: 'placed', complete: true },
      { key: 'packed', complete: true },
      { key: 'shipped', complete: true },
      { key: 'delivered', complete: false },
    ]);
    expect(stages[2].detail).toBe('Mar 02, 09:30 · In transit');
    expect(stages[3].detail).toBe('Est. Nov 2 - 6');
    expect(orderPackageStatusText(summary.packages[0])).toBe('In transit');
  });

  it('marks only placed and packed complete for a prepared shipment', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.PREPARED,
            preparedAt: new Date(2026, 2, 1, 10, 0),
          }),
        ],
      })],
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
      },
    }));

    const stages = summary.packages[0].stages;
    expect(stages.map(stage => ({ key: stage.key, complete: stage.complete, detail: stage.detail }))).toEqual([
      { key: 'placed', complete: true, detail: 'Mar 01, 10:00' },
      { key: 'packed', complete: true, detail: 'Mar 01, 10:00' },
      { key: 'shipped', complete: false, detail: '' },
      { key: 'delivered', complete: false, detail: 'Est. Nov 2 - 6' },
    ]);
    expect(orderPackageStatusText(summary.packages[0])).toBe('Preparing');
  });

  it('returns no stages for a canceled package', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          // Shipments have no canceled status: unknown statuses map to the canceled state.
          buildShipment({ id: 'shipment-1', status: 'canceled' as unknown as ShipmentStatuses }),
        ],
      })],
    }));

    expect(summary.packages[0].state).toBe('canceled');
    expect(summary.packages[0].stages).toEqual([]);
    expect(orderPackageTone(summary.packages[0])).toBe('red');
  });
});

describe('ship-by detail', () => {
  it('derives the ship-by date from the processing window', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.PREPARED,
            preparedAt: new Date(2026, 2, 1, 10, 0),
          }),
        ],
      })],
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
        processingTimeMaxDays: 3,
      },
    }));

    expect(summary.packages[0].shipByDetail).toBe('Ships by Mar 04');
  });

  it('leaves the ship-by date empty without a processing window', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.PREPARED })],
      })],
    }));

    expect(summary.packages[0].shipByDetail).toBe('');
  });

  it('uses the ship-by date as the detail of an incomplete shipped stage', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.PREPARED,
            preparedAt: new Date(2026, 2, 1, 10, 0),
          }),
        ],
      })],
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
        processingTimeMaxDays: 3,
      },
    }));

    const shipped = summary.packages[0].stages[2];
    expect(shipped).toEqual({
      key: 'shipped',
      label: 'Shipped',
      detail: 'Ships by Mar 04',
      complete: false,
    });
  });
});

describe('package updates', () => {
  it('maps updates newest first, preferring the note over the status label', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.IN_TRANSIT,
            dispatchedAt: new Date(2026, 2, 2, 9, 30),
            updates: [
              buildUpdate({
                id: 'update-prepared',
                status: ShipmentStatuses.PREPARED,
                occurredAt: new Date(2026, 1, 28, 8, 5),
              }),
              buildUpdate({
                id: 'update-transit',
                status: ShipmentStatuses.IN_TRANSIT,
                occurredAt: new Date(2026, 2, 3, 7, 0),
              }),
              buildUpdate({
                id: 'update-dispatched',
                status: ShipmentStatuses.DISPATCHED,
                occurredAt: new Date(2026, 2, 2, 9, 30),
                note: '  Handed to carrier  ',
              }),
            ],
          }),
        ],
      })],
    }));

    expect(summary.packages[0].updates).toEqual([
      { id: 'update-transit', title: 'In transit', occurredAt: 'Mar 03, 07:00' },
      { id: 'update-dispatched', title: 'Handed to carrier', occurredAt: 'Mar 02, 09:30' },
      { id: 'update-prepared', title: 'Prepared', occurredAt: 'Feb 28, 08:05' },
    ]);
  });

  it('leaves updates empty for a legacy package', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      legacy: buildLegacy({
        status: 'in_transit',
        trackingNumber: 'TRACK-1',
        shippedAt: new Date(2026, 2, 2, 10, 0),
      }),
    }));

    expect(summary.packages[0].updates).toEqual([]);
  });
});

describe('buildOrderPackages legacy fallback', () => {
  it('builds a single package from legacy shipping', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 2, amountMinor: 4000 })],
      legacy: buildLegacy({
        status: 'in_transit',
        trackingNumber: 'TRACK-1',
        carrier: 'UPS',
        shippedAt: new Date(2026, 2, 2, 10, 0),
      }),
    }));

    expect(summary.packages).toHaveLength(1);
    expect(summary.packages[0]).toMatchObject({
      id: 'legacy-package',
      index: 1,
      total: 1,
      state: 'in_transit',
      carrier: 'UPS',
      trackingNumber: 'TRACK-1',
    });
    expect(summary.packages[0].stages).toEqual([
      {
        key: 'placed', label: 'Order placed', detail: 'Mar 01, 10:00', complete: true,
      },
      {
        key: 'packed', label: 'Packed', detail: 'Mar 02, 10:00', complete: true,
      },
      {
        key: 'shipped', label: 'Shipped', detail: 'Mar 02, 10:00 · In transit', complete: true,
      },
      {
        key: 'delivered', label: 'Delivered', detail: '', complete: false,
      },
    ]);
    expect(summary.packages[0].lines).toHaveLength(1);
    expect(summary.packages[0].lines[0]).toMatchObject({
      orderItemId: 'item-1',
      quantity: 2,
      amountMinor: 4000,
    });
    expect(summary.counts.inTransit).toBe(1);
  });

  it('marks every legacy stage complete once delivered', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      legacy: buildLegacy({
        status: 'delivered',
        trackingNumber: 'TRACK-1',
        shippedAt: new Date(2026, 2, 2, 10, 0),
        deliveredAt: new Date(2026, 2, 5, 15, 45),
      }),
    }));

    expect(summary.packages[0].stages).toEqual([
      {
        key: 'placed', label: 'Order placed', detail: 'Mar 01, 10:00', complete: true,
      },
      {
        key: 'packed', label: 'Packed', detail: 'Mar 02, 10:00', complete: true,
      },
      {
        key: 'shipped', label: 'Shipped', detail: 'Mar 02, 10:00', complete: true,
      },
      {
        key: 'delivered', label: 'Delivered', detail: 'Mar 05, 15:45', complete: true,
      },
    ]);
    expect(summary.packages[0].statusDetail).toBe('Mar 05');
    expect(orderPackageStatusText(summary.packages[0])).toBe('Delivered Mar 05');
  });

  it('keeps the delivered stage upcoming for a legacy package in transit', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      legacy: buildLegacy({
        status: 'in_transit',
        trackingNumber: 'TRACK-1',
        shippedAt: new Date(2026, 2, 2, 10, 0),
      }),
      shippingEstimate: {
        earliest: new Date(Date.UTC(new Date().getUTCFullYear(), 10, 2)),
        latest: new Date(Date.UTC(new Date().getUTCFullYear(), 10, 6)),
      },
    }));

    expect(summary.packages[0].estimateDetail).toBe('Est. Nov 2 - 6');
    expect(summary.packages[0].stages[3]).toEqual({
      key: 'delivered',
      label: 'Delivered',
      detail: 'Est. Nov 2 - 6',
      complete: false,
    });
    expect(orderPackageStatusText(summary.packages[0])).toBe('In transit');
  });

  it.each([
    ['pre_transit', 'preparing'],
    ['in_transit', 'in_transit'],
    ['shipped', 'in_transit'],
    ['delivered', 'delivered'],
  ])('maps legacy status %s to state %s', (status, state) => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      legacy: buildLegacy({ status, trackingNumber: 'TRACK-1' }),
    }));

    expect(summary.packages[0].state).toBe(state);
  });

  it('returns no packages when legacy shipping carries no signal', () => {
    const summary = buildOrderPackages(buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      legacy: buildLegacy({ status: 'pre_transit' }),
    }));

    expect(summary.packages).toEqual([]);
    expect(summary.counts.total).toBe(0);
  });
});

describe('formatPackageCounts', () => {
  it('joins non-empty buckets in delivery order', () => {
    expect(formatPackageCounts({
      total: 3,
      delivered: 1,
      inTransit: 1,
      preparing: 1,
      canceled: 0,
    })).toBe('1 delivered · 1 in transit · 1 preparing');
  });

  it('omits empty buckets', () => {
    expect(formatPackageCounts({
      total: 2,
      delivered: 0,
      inTransit: 2,
      preparing: 0,
      canceled: 0,
    })).toBe('2 in transit');
    expect(formatPackageCounts({
      total: 1,
      delivered: 0,
      inTransit: 0,
      preparing: 0,
      canceled: 1,
    })).toBe('1 canceled');
    expect(formatPackageCounts({
      total: 0,
      delivered: 0,
      inTransit: 0,
      preparing: 0,
      canceled: 0,
    })).toBe('');
  });
});

describe('orderItemsCount', () => {
  it('sums purchased product quantities', () => {
    const orderShop = buildOrderShop({
      products: [
        buildProduct({ id: 'item-1', quantity: 2, amountMinor: 2000 }),
        buildProduct({ id: 'item-2', quantity: 3, amountMinor: 3000 }),
      ],
    });

    expect(orderItemsCount(orderShop)).toBe(5);
  });
});

describe('buildOrderStages', () => {
  it('keeps a paid, unshipped order at the placed stage', () => {
    const orderShop = buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      fulfillmentStatus: FulfillmentAggregateStatuses.UNFULFILLED,
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
        processingTimeMaxDays: 3,
      },
    });

    expect(buildOrderStages(orderShop)).toEqual([
      {
        key: 'placed', label: 'Order placed', detail: 'Mar 01, 10:00', complete: true,
      },
      {
        key: 'packed', label: 'Packed', detail: 'Seller is preparing', complete: false,
      },
      {
        key: 'shipped', label: 'Shipped', detail: 'Ships by Mar 04', complete: false,
      },
      {
        key: 'delivered', label: 'Delivered', detail: 'Est. Nov 2 - 6', complete: false,
      },
    ]);
  });

  it('leaves the ship-by detail empty when the order has no processing window', () => {
    const orderShop = buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      fulfillmentStatus: FulfillmentAggregateStatuses.PREPARED,
    });

    const stages = buildOrderStages(orderShop);
    expect(stages[1]).toEqual({
      key: 'packed', label: 'Packed', detail: '', complete: true,
    });
    expect(stages[2]).toEqual({
      key: 'shipped', label: 'Shipped', detail: '', complete: false,
    });
    expect(stages[3]).toEqual({
      key: 'delivered', label: 'Delivered', detail: '', complete: false,
    });
  });

  it('completes every stage for a delivered order', () => {
    const orderShop = buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 1, amountMinor: 1000 })],
      fulfillmentStatus: FulfillmentAggregateStatuses.DELIVERED,
      shippingEstimate: {
        earliest: new Date(Date.UTC(2026, 10, 2)),
        latest: new Date(Date.UTC(2026, 10, 6)),
        processingTimeMaxDays: 3,
      },
    });

    expect(buildOrderStages(orderShop).map(stage => ({
      key: stage.key,
      complete: stage.complete,
    }))).toEqual([
      { key: 'placed', complete: true },
      { key: 'packed', complete: true },
      { key: 'shipped', complete: true },
      { key: 'delivered', complete: true },
    ]);
  });
});

describe('buildAwaitingShipmentLines', () => {
  it('returns only products in no non-voided shipment, at full quantity', () => {
    const orderShop = buildOrderShop({
      products: [
        buildProduct({ id: 'item-1', quantity: 2, amountMinor: 4000 }),
        buildProduct({ id: 'item-2', quantity: 1, amountMinor: 1500 }),
        buildProduct({ id: 'item-3', quantity: 3, amountMinor: 3000 }),
      ],
      groups: [
        buildGroup({
          shipments: [
            buildShipment({
              id: 'shipment-1',
              status: ShipmentStatuses.PREPARED,
              items: [{ order_item_id: 'item-1', quantity: 1 }],
            }),
            buildShipment({
              id: 'shipment-voided',
              status: ShipmentStatuses.VOIDED,
              items: [{ order_item_id: 'item-3', quantity: 1 }],
            }),
          ],
        }),
      ],
    });

    const lines = buildAwaitingShipmentLines(orderShop);
    expect(lines.map(line => line.id)).toEqual(['awaiting:item-2', 'awaiting:item-3']);
    expect(lines).toEqual([
      {
        id: 'awaiting:item-2',
        orderItemId: 'item-2',
        title: 'Product item-2',
        imageUrl: undefined,
        variantLabels: [],
        quantity: 1,
        unitPriceMinor: 1500,
        amountMinor: 1500,
        currency: 'USD',
      },
      {
        id: 'awaiting:item-3',
        orderItemId: 'item-3',
        title: 'Product item-3',
        imageUrl: undefined,
        variantLabels: [],
        quantity: 3,
        unitPriceMinor: 1000,
        amountMinor: 3000,
        currency: 'USD',
      },
    ]);
  });

  it('returns every product when nothing has shipped', () => {
    const orderShop = buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 2, amountMinor: 4000 })],
      fulfillmentStatus: FulfillmentAggregateStatuses.PREPARED,
    });

    expect(buildAwaitingShipmentLines(orderShop).map(line => ({
      id: line.id,
      quantity: line.quantity,
      amountMinor: line.amountMinor,
    }))).toEqual([
      { id: 'awaiting:item-1', quantity: 2, amountMinor: 4000 },
    ]);
  });

  it('returns no awaiting lines when the legacy package already covers the order', () => {
    const orderShop = buildOrderShop({
      products: [buildProduct({ id: 'item-1', quantity: 2, amountMinor: 4000 })],
      legacy: buildLegacy({
        status: 'in_transit',
        trackingNumber: 'TRACK-1',
        carrier: 'UPS',
        shippedAt: new Date(2026, 2, 2, 10, 0),
      }),
    });

    expect(buildAwaitingShipmentLines(orderShop)).toEqual([]);
  });
});

describe('paymentMethodLabel', () => {
  it('masks a card with its brand and last four digits', () => {
    expect(paymentMethodLabel({ type: 'card', card_brand: 'visa', card_last4: 4821 })).toBe('Visa •••• 4821');
  });

  it('falls back to the masked digits when the brand is missing', () => {
    expect(paymentMethodLabel({ type: 'card', card_last4: 4821 })).toBe('•••• 4821');
  });

  it('names the method without inventing card details', () => {
    expect(paymentMethodLabel({ type: 'card' })).toBe('Card');
    expect(paymentMethodLabel({ type: 'cash' })).toBe('Cash');
  });
});
