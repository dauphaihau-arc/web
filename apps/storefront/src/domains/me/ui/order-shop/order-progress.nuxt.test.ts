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
import { describe, expect, it } from 'vitest';
import type { TimelineItem } from '@arc/ui/patterns/timeline.vue';
import type {
  FulfillmentGroup,
  FulfillmentShipment,
  GetOrderShopsResponse,
  LegacyOrderShipping,
} from '~/domains/me/api/order/contracts/order.contract';
import { buildOrderProgressSteps } from './order-progress';

type OrderShop = GetOrderShopsResponse['order_shops'][number];
type FulfillmentProgress = OrderShop['fulfillment']['progress'];

function buildShipment(input: {
  id: string
  status: ShipmentStatuses
  updateStatuses?: ShipmentStatuses[]
  dispatchedAt?: Date
  deliveredAt?: Date
}): FulfillmentShipment {
  return {
    id: input.id,
    group_id: 'group-1',
    status: input.status,
    origin_countries: ['US'],
    prepared_at: new Date(2026, 2, 1, 10, 0),
    dispatched_at: input.dispatchedAt,
    delivered_at: input.deliveredAt,
    created_at: new Date(2026, 2, 1, 10, 0),
    updated_at: new Date(2026, 2, 1, 10, 0),
    items: [{ order_item_id: 'item-1', quantity: 1 }],
    updates: (input.updateStatuses ?? []).map((status, index) => ({
      id: `update-${index}`,
      status,
      actor_type: ShipmentUpdateActorTypes.SYSTEM,
      source: ShipmentUpdateSources.SYSTEM,
      occurred_at: new Date(2026, 2, 2, 10, 0),
    })),
  };
}

function buildGroup(input: {
  shipments?: FulfillmentShipment[]
  ordered?: number
} = {}): FulfillmentGroup {
  const shipments = input.shipments ?? [];
  const ordered = input.ordered ?? shipments.length;

  return {
    id: 'group-1',
    method: FulfillmentMethods.SELLER,
    operator: FulfillmentOperators.SELLER,
    provenance: FulfillmentProvenances.CONFIRMED_ORDER,
    items: [{ order_item_id: 'item-1', quantity: ordered }],
    progress: {
      ordered,
      prepared: 0,
      dispatched: 0,
      delivered: 0,
      canceled: 0,
      outstanding: ordered,
    },
    shipments,
  };
}

function buildOrderShop(input: {
  status?: OrderStatuses
  cancelReason?: string
  canceledAt?: Date
  aggregateStatus?: FulfillmentAggregateStatuses
  progress?: Partial<FulfillmentProgress>
  groups?: FulfillmentGroup[]
  legacyShipping?: Partial<LegacyOrderShipping>
  shipping?: OrderShop['shipping']
}): OrderShop {
  return {
    id: 'order-1',
    order_number: 'ORD-1',
    shop: { id: 'shop-1', shop_name: 'Shop', slug: 'shop' },
    payment: { type: 'card' },
    status: input.status ?? OrderStatuses.PAID,
    products: [],
    promo_codes: [],
    fulfillment: {
      status: input.aggregateStatus ?? FulfillmentAggregateStatuses.UNFULFILLED,
      requires_reconciliation: false,
      progress: {
        ordered: 0,
        prepared: 0,
        dispatched: 0,
        delivered: 0,
        canceled: 0,
        outstanding: 0,
        ...input.progress,
      },
      groups: input.groups ?? [],
      legacy_shipping: {
        status: 'pre_transit',
        updated_at: new Date('2026-03-01T10:00:00.000Z'),
        to_country: 'US',
        from_countries: ['US'],
        estimated_delivery: new Date('2026-03-10T10:00:00.000Z'),
        ...input.legacyShipping,
      },
    },
    currency: 'USD',
    shipping: input.shipping,
    subtotal_minor: 0,
    shipping_minor: 0,
    discount_minor: 0,
    sale_discount_minor: 0,
    total_minor: 0,
    canceled_at: input.canceledAt,
    cancel_reason: input.cancelReason,
    created_at: new Date(2026, 2, 1, 12, 0),
  } as OrderShop;
}

const SHIPPING_ANCHOR = new Date(2026, 2, 1, 10, 0);

/** Minimal accepted shipping snapshot; only the delivery estimate matters here. */
function buildShipping(input: {
  latestDelivery: Date
  earliestDelivery?: Date
}): NonNullable<OrderShop['shipping']> {
  return {
    shop_id: 'shop-1',
    currency: 'USD',
    charge: {
      currency: 'USD',
      quantity: 1,
      base_unit: { product_id: 'product-1', inventory_id: 'inventory-1', one_item_fee_minor: 0 },
      base_item_fee_minor: 0,
      base_item_total_minor: 0,
      additional_items_quantity: 0,
      additional_components: [],
      additional_item_fee_minor_total: 0,
      total_minor: 0,
    },
    estimate: {
      combined_min_days: 1,
      combined_max_days: 2,
      anchor_at: SHIPPING_ANCHOR,
      earliest_delivery_date: input.earliestDelivery ?? input.latestDelivery,
      latest_delivery_date: input.latestDelivery,
      processing_time_min_days: 0,
      processing_time_max_days: 1,
      delivery_time_min_days: 1,
      delivery_time_max_days: 1,
    },
    units: [],
  };
}

function byKey(steps: TimelineItem[]): Record<string, TimelineItem> {
  return Object.fromEntries(steps.map(step => [step.key, step]));
}

function states(steps: TimelineItem[]): string[] {
  return steps.map(step => `${step.key}:${step.state}`);
}

/**
 * The timeline is one ladder: completed milestones form a prefix, then at most
 * one active milestone, then pending ones. Failed milestones only replace the
 * confirmation step or are appended last.
 */
function assertLadder(steps: TimelineItem[], expectedActive: string | null): void {
  const ranks = steps
    .filter(step => step.state !== 'failed')
    .map(step => step.state === 'active' ? 1 : step.state === 'pending' ? 2 : 0);

  for (let index = 1; index < ranks.length; index++) {
    expect(ranks[index]).toBeGreaterThanOrEqual(ranks[index - 1]);
  }

  steps.forEach((step, index) => {
    if (step.state === 'failed') {
      expect([0, steps.length - 1]).toContain(index);
    }
  });

  const active = steps.filter(step => step.state === 'active');

  if (expectedActive === null) {
    expect(active).toHaveLength(0);
  }
  else {
    expect(active).toHaveLength(1);
    expect(active[0]?.key).toBe(expectedActive);
  }
}

describe('buildOrderProgressSteps', () => {
  it('keeps an unfulfilled paid order on preparing', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.UNFULFILLED,
      progress: { ordered: 5, outstanding: 5 },
      groups: [buildGroup({ ordered: 5 })],
    }));
    const steps = byKey(result);

    expect(states(result)).toEqual([
      'confirmed:completed',
      'preparing:active',
      'shipped:pending',
      'delivered:pending',
    ]);
    expect(steps.confirmed?.title).toBe('Order confirmed');
    expect(steps.confirmed?.date).toBe('1 Mar 12:00');
    expect(steps.in_transit).toBeUndefined();
    assertLadder(result, 'preparing');
  });

  it('completes preparing with real partial counts when some units are prepared', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.PREPARED,
      progress: { ordered: 5, prepared: 3, outstanding: 2 },
      groups: [buildGroup({ shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.PREPARED })] })],
    }));
    const steps = byKey(result);

    expect(steps.preparing?.state).toBe('completed');
    expect(steps.preparing?.description).toBe('3 of 5 items prepared');
    expect(steps.preparing?.date).toBe('1 Mar 10:00');
    expect(steps.shipped?.state).toBe('active');
    expect(steps.shipped?.date).toBeUndefined();
    expect(steps.in_transit?.state).toBe('pending');
    expect(steps.delivered?.state).toBe('pending');
    assertLadder(result, 'shipped');
  });

  it('keeps transit active, never delivered, while a dispatched parcel has no delivery yet', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.PARTIALLY_SHIPPED,
      // Stage-exclusive roll-up: prepared units already shipped, so prepared is 0.
      progress: {
        ordered: 5, prepared: 0, dispatched: 2, outstanding: 3,
      },
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DISPATCHED,
            dispatchedAt: new Date(2026, 2, 2, 9, 5),
          }),
        ],
      })],
    }));
    const steps = byKey(result);

    expect(states(result)).toEqual([
      'confirmed:completed',
      'preparing:completed',
      'shipped:completed',
      'in_transit:active',
      'delivered:pending',
    ]);
    expect(steps.shipped?.description).toBe('2 of 5 items shipped');
    expect(steps.shipped?.date).toBe('2 Mar 9:05');
    expect(steps.preparing?.description).toBeUndefined();
    expect(steps.in_transit?.date).toBeUndefined();
    assertLadder(result, 'in_transit');
  });

  it('completes transit from delivery evidence when no transit event was recorded', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.DELIVERED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, delivered: 2,
      },
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            updateStatuses: [ShipmentStatuses.DISPATCHED, ShipmentStatuses.DELIVERED],
            dispatchedAt: new Date(2026, 2, 2, 9, 5),
            deliveredAt: new Date(2026, 2, 4, 17, 30),
          }),
        ],
      })],
    }));
    const steps = byKey(result);

    expect(states(result)).toEqual([
      'confirmed:completed',
      'preparing:completed',
      'shipped:completed',
      'in_transit:completed',
      'delivered:completed',
    ]);
    expect(steps.in_transit?.state).toBe('completed');
    expect(steps.in_transit?.date).toBeUndefined();
    expect(steps.delivered?.description).toBeUndefined();
    expect(steps.delivered?.date).toBe('4 Mar 5:30');
    assertLadder(result, null);
  });

  it('completes the timeline for a fully delivered order with transit evidence', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.DELIVERED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, delivered: 2,
      },
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            updateStatuses: [
              ShipmentStatuses.DISPATCHED,
              ShipmentStatuses.IN_TRANSIT,
              ShipmentStatuses.DELIVERED,
            ],
            dispatchedAt: new Date(2026, 2, 2, 9, 5),
            deliveredAt: new Date(2026, 2, 4, 17, 30),
          }),
        ],
      })],
    }));
    const steps = byKey(result);

    expect(states(result)).toEqual([
      'confirmed:completed',
      'preparing:completed',
      'shipped:completed',
      'in_transit:completed',
      'delivered:completed',
    ]);
    expect(steps.shipped?.date).toBe('2 Mar 9:05');
    expect(steps.in_transit?.date).toBe('2 Mar 10:00');
    expect(steps.delivered?.date).toBe('4 Mar 5:30');
    assertLadder(result, null);
  });

  it('marks delivered active only once transit is completed for a partial delivery', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
      progress: {
        ordered: 4, prepared: 0, dispatched: 3, delivered: 1, outstanding: 1,
      },
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            updateStatuses: [ShipmentStatuses.DISPATCHED, ShipmentStatuses.DELIVERED],
            dispatchedAt: new Date(2026, 2, 2, 9, 5),
            deliveredAt: new Date(2026, 2, 4, 17, 30),
          }),
          buildShipment({ id: 'shipment-2', status: ShipmentStatuses.DISPATCHED }),
        ],
      })],
    }));
    const steps = byKey(result);

    expect(steps.in_transit?.state).toBe('completed');
    expect(steps.delivered?.state).toBe('active');
    expect(steps.delivered?.description).toBe('1 of 4 items delivered');
    expect(steps.shipped?.description).toBe('3 of 4 items shipped');
    assertLadder(result, 'delivered');
  });

  it('keeps a partially canceled timeline intact and names the canceled units', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.PREPARED,
      progress: {
        ordered: 5, prepared: 2, canceled: 1, outstanding: 2,
      },
      groups: [buildGroup({ shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.PREPARED })] })],
    }));
    const steps = byKey(result);

    expect(steps.confirmed?.state).toBe('completed');
    expect(steps.preparing?.state).toBe('completed');
    expect(steps.preparing?.description).toBe('2 of 4 items prepared');
    expect(steps.preparing?.date).toBe('1 Mar 10:00');
    expect(steps.shipped?.state).toBe('active');
    expect(steps.in_transit?.state).toBe('pending');
    expect(steps.delivered?.state).toBe('pending');
    expect(steps.canceled?.state).toBe('failed');
    expect(steps.canceled?.title).toBe('Canceled');
    expect(steps.canceled?.description).toBe('1 of 5 items canceled');
    assertLadder(result, 'shipped');
  });

  it('fails confirmation and appends a canceled step for a fully canceled order', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      status: OrderStatuses.CANCELED,
      cancelReason: 'Item is out of stock',
      canceledAt: new Date(2026, 2, 6, 8, 41),
      aggregateStatus: FulfillmentAggregateStatuses.CANCELED,
      progress: { ordered: 2, canceled: 2 },
      groups: [buildGroup({ shipments: [] })],
    }));
    const steps = byKey(result);

    expect(steps.confirmed?.state).toBe('failed');
    expect(steps.confirmed?.title).toBe('Order canceled');
    expect(steps.confirmed?.description).toBe('Item is out of stock');
    expect(steps.preparing?.state).toBe('pending');
    expect(steps.shipped?.state).toBe('pending');
    expect(steps.delivered?.state).toBe('pending');
    expect(steps.canceled?.state).toBe('failed');
    expect(steps.canceled?.description).toBeUndefined();
    expect(steps.canceled?.date).toBe('6 Mar 8:41');
    assertLadder(result, null);
  });

  it('reports an expired checkout as expired, not as a canceled order', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      status: OrderStatuses.EXPIRED,
      progress: { ordered: 1, outstanding: 1 },
      groups: [buildGroup({ ordered: 1 })],
    }));
    const steps = byKey(result);

    expect(steps.confirmed?.state).toBe('failed');
    expect(steps.confirmed?.title).toBe('Order expired');
    expect(steps.confirmed?.description).toBe('Checkout session expired before payment completed.');
    expect(steps.confirmed?.date).toBe('1 Mar 12:00');
    expect(steps.canceled).toBeUndefined();
    expect(states(result).slice(1)).toEqual([
      'preparing:pending',
      'shipped:pending',
      'delivered:pending',
    ]);
    assertLadder(result, null);
  });

  it('derives legacy orders from the legacy shipping record only', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      groups: [],
      legacyShipping: {
        status: 'shipped',
        shipped_at: new Date(2026, 2, 2, 10, 0),
        estimated_delivery: new Date(2026, 2, 12, 10, 0),
      },
    }));
    const steps = byKey(result);

    expect(states(result)).toEqual([
      'confirmed:completed',
      'preparing:completed',
      'shipped:completed',
      'delivered:active',
    ]);
    expect(steps.in_transit).toBeUndefined();
    expect(steps.shipped?.date).toBe('2 Mar 10:00');
    expect(steps.delivered?.description).toBeUndefined();
    expect(steps.delivered?.date).toBe('Est. 12 Mar');
    assertLadder(result, 'delivered');
  });

  it('accepts a legacy shipped status without a shipped_at timestamp', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      groups: [],
      legacyShipping: { status: 'dispatched' },
    }));
    const steps = byKey(result);

    expect(steps.shipped?.state).toBe('completed');
    expect(steps.shipped?.date).toBeUndefined();
    expect(steps.delivered?.state).toBe('active');
    assertLadder(result, 'delivered');
  });

  it('completes legacy transit when the legacy record already shows delivery', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      groups: [],
      legacyShipping: {
        status: 'delivered',
        delivered_at: new Date(2026, 2, 5, 14, 25),
      },
    }));

    expect(states(result)).toEqual([
      'confirmed:completed',
      'preparing:completed',
      'shipped:completed',
      'in_transit:completed',
      'delivered:completed',
    ]);
    expect(byKey(result).delivered?.date).toBe('5 Mar 2:25');
    expect(byKey(result).in_transit?.date).toBeUndefined();
    assertLadder(result, null);
  });

  it('shows the accepted delivery estimate on a pending delivered step', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      progress: { ordered: 2, outstanding: 2 },
      groups: [buildGroup({ ordered: 2 })],
      shipping: buildShipping({ latestDelivery: new Date(2026, 9, 31, 10, 0) }),
    }));
    const steps = byKey(result);

    expect(steps.delivered?.state).toBe('pending');
    expect(steps.delivered?.date).toBe('Est. 31 Oct');
    // Pending earlier milestones never carry a date of their own.
    expect(steps.preparing?.date).toBeUndefined();
    expect(steps.shipped?.date).toBeUndefined();
    assertLadder(result, 'preparing');
  });

  it('shows the accepted delivery estimate on the active delivered step', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
      progress: {
        ordered: 4, prepared: 0, dispatched: 3, delivered: 1, outstanding: 1,
      },
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            updateStatuses: [ShipmentStatuses.DISPATCHED, ShipmentStatuses.DELIVERED],
            dispatchedAt: new Date(2026, 2, 2, 9, 5),
            deliveredAt: new Date(2026, 2, 4, 17, 30),
          }),
          buildShipment({ id: 'shipment-2', status: ShipmentStatuses.DISPATCHED }),
        ],
      })],
      shipping: buildShipping({ latestDelivery: new Date(2026, 10, 2, 10, 0) }),
    }));
    const steps = byKey(result);

    expect(steps.delivered?.state).toBe('active');
    expect(steps.delivered?.date).toBe('Est. 2 Nov');
    expect(steps.delivered?.description).toBe('1 of 4 items delivered');
    assertLadder(result, 'delivered');
  });

  it('omits the delivered date when the payload carries no estimate', () => {
    const order = buildOrderShop({
      progress: { ordered: 1, outstanding: 1 },
      groups: [buildGroup({ ordered: 1 })],
    });
    Reflect.deleteProperty(order.fulfillment.legacy_shipping, 'estimated_delivery');

    const steps = byKey(buildOrderProgressSteps(order));

    expect(steps.delivered?.state).toBe('pending');
    expect(steps.delivered?.date).toBeUndefined();
  });

  it('falls back to the legacy shipping estimate when no accepted quote exists', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      progress: { ordered: 1, outstanding: 1 },
      groups: [buildGroup({ ordered: 1 })],
      legacyShipping: { estimated_delivery: new Date(2026, 9, 31, 10, 0) },
    }));

    expect(byKey(result).delivered?.date).toBe('Est. 31 Oct');
  });

  it('keeps the recorded delivery timestamp instead of the estimate once delivered completes', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.DELIVERED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, delivered: 2,
      },
      groups: [buildGroup({
        shipments: [
          buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.DELIVERED,
            updateStatuses: [ShipmentStatuses.DISPATCHED, ShipmentStatuses.DELIVERED],
            dispatchedAt: new Date(2026, 2, 2, 9, 5),
            deliveredAt: new Date(2026, 2, 4, 17, 30),
          }),
        ],
      })],
      shipping: buildShipping({ latestDelivery: new Date(2026, 9, 31, 10, 0) }),
    }));
    const steps = byKey(result);

    expect(steps.delivered?.state).toBe('completed');
    expect(steps.delivered?.date).toBe('4 Mar 5:30');
    expect(steps.delivered?.date).not.toContain('Est.');
    assertLadder(result, null);
  });

  it('never shows an estimate on a delivered step that is already completed', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      aggregateStatus: FulfillmentAggregateStatuses.DELIVERED,
      progress: {
        ordered: 1, prepared: 0, dispatched: 1, delivered: 1,
      },
      groups: [buildGroup({
        shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.DELIVERED })],
      })],
      shipping: buildShipping({ latestDelivery: new Date(2026, 9, 31, 10, 0) }),
    }));
    const steps = byKey(result);

    expect(steps.delivered?.state).toBe('completed');
    expect(steps.delivered?.date).toBeUndefined();
    assertLadder(result, null);
  });

  it('marks confirmation as awaiting payment and does not start preparing', () => {
    const result = buildOrderProgressSteps(buildOrderShop({
      status: OrderStatuses.AWAITING_PAYMENT,
      progress: { ordered: 3, outstanding: 3 },
      groups: [buildGroup({ ordered: 3 })],
    }));
    const steps = byKey(result);

    expect(steps.confirmed?.state).toBe('active');
    expect(steps.confirmed?.description).toBe('Awaiting payment');
    expect(steps.preparing?.state).toBe('pending');
    expect(steps.shipped?.state).toBe('pending');
    expect(steps.delivered?.state).toBe('pending');
    assertLadder(result, 'confirmed');
  });
});
