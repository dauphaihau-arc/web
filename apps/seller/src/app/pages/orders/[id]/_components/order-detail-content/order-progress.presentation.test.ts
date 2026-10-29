import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import { OrderStatuses, PaymentTypes } from '@arc/enums/order';
import type { TimelineItem } from '@arc/ui/patterns/timeline.vue';
import { describe, expect, it } from 'vitest';
import { buildOrderProgressSteps, formatProgressTimestamp } from './order-progress.presentation';
import type { ShopOrderPayout } from '~/domains/shop/api/finance/contracts/order-payout.contract';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

type Group = ShopOrder['fulfillment']['groups'][number];
type Shipment = Group['shipments'][number];
type Progress = ShopOrder['fulfillment']['progress'];
type LegacyShipping = ShopOrder['fulfillment']['legacy_shipping'];

const TERMINAL_KEYS = ['canceled', 'refunded'];

/**
 * The ladder invariant shared by every mapping: completed steps form a prefix,
 * at most one step is active, and nothing is ever completed behind an open
 * step. Terminal markers (canceled/refunded) may only trail the ladder.
 */
function expectStateInvariant(steps: TimelineItem[]): void {
  const ladder = steps.filter(step => !TERMINAL_KEYS.includes(step.key ?? ''));
  const terminal = steps.filter(step => TERMINAL_KEYS.includes(step.key ?? ''));

  expect(steps.slice(ladder.length)).toEqual(terminal);
  expect(terminal.every((step, index) => terminal[index - 1] === undefined
    || TERMINAL_KEYS.indexOf(step.key ?? '') > TERMINAL_KEYS.indexOf(terminal[index - 1].key ?? '')))
    .toBe(true);

  const actives = ladder.filter(step => step.state === 'active');
  expect(actives.length).toBeLessThanOrEqual(1);

  const activeIndex = ladder.findIndex(step => step.state === 'active');
  const boundary = activeIndex === -1
    ? ladder.findIndex(step => step.state !== 'completed')
    : activeIndex;

  if (boundary === -1) return;

  expect(ladder.slice(0, boundary).every(step => step.state === 'completed')).toBe(true);
  expect(ladder.slice(boundary + 1).every(step => step.state === 'pending')).toBe(true);
  if (activeIndex === -1) expect(ladder[boundary].state).toBe('pending');
}

function stateOf(steps: TimelineItem[], key: string): TimelineItem['state'] {
  return steps.find(step => step.key === key)?.state;
}

function buildShipment(input: {
  id: string
  status: ShipmentStatuses
  preparedAt?: Date
  dispatchedAt?: Date
  deliveredAt?: Date
  updates?: Array<{ id: string, status: ShipmentStatuses, occurredAt: Date }>
}): Shipment {
  return {
    id: input.id,
    group_id: 'group-1',
    status: input.status,
    origin_countries: [],
    prepared_at: input.preparedAt ?? new Date(2026, 0, 3, 10, 0),
    dispatched_at: input.dispatchedAt,
    delivered_at: input.deliveredAt,
    created_at: new Date(2026, 0, 3, 10, 0),
    updated_at: new Date(2026, 0, 3, 10, 0),
    items: [],
    updates: (input.updates ?? []).map(update => ({
      id: update.id,
      status: update.status,
      actor_type: 'seller',
      source: 'seller',
      occurred_at: update.occurredAt,
    })),
  } as unknown as Shipment;
}

function buildGroup(progress: Progress, shipments: Shipment[]): Group {
  return {
    id: 'group-1',
    method: 'seller',
    operator: 'seller',
    provenance: 'confirmed_order',
    items: [],
    progress,
    shipments,
  } as unknown as Group;
}

function buildOrder(input: {
  status?: OrderStatuses
  fulfillmentStatus?: FulfillmentAggregateStatuses
  progress?: Partial<Progress>
  shipments?: Shipment[]
  legacy?: Partial<LegacyShipping>
  payment?: Partial<ShopOrder['payment']>
  canceledAt?: Date
  shipping?: ShopOrder['shipping']
} = {}): ShopOrder {
  const progress: Progress = {
    ordered: 2,
    prepared: 0,
    dispatched: 0,
    delivered: 0,
    canceled: 0,
    outstanding: 2,
    ...input.progress,
  };

  return {
    id: 'order-1',
    order_number: 'SO-1001',
    status: input.status ?? OrderStatuses.PAID,
    created_at: new Date(2026, 0, 2, 9, 30),
    canceled_at: input.canceledAt,
    shipping: input.shipping,
    payment: {
      type: PaymentTypes.CARD,
      refund_status: 'not_required',
      ...input.payment,
    },
    fulfillment: {
      status: input.fulfillmentStatus ?? FulfillmentAggregateStatuses.UNFULFILLED,
      requires_reconciliation: false,
      progress,
      groups: [buildGroup(progress, input.shipments ?? [])],
      legacy_shipping: {
        status: 'pre_transit',
        updated_at: new Date(2026, 0, 3, 10, 0),
        to_country: 'US',
        from_countries: [],
        estimated_delivery: new Date(2026, 0, 9, 10, 0),
        ...input.legacy,
      },
    },
  } as unknown as ShopOrder;
}

function buildLegacyOrder(input: {
  legacy: Partial<LegacyShipping>
  status?: OrderStatuses
  progress?: Partial<Progress>
}): ShopOrder {
  const order = buildOrder({
    status: input.status,
    progress: input.progress,
    legacy: input.legacy,
  });

  order.fulfillment.groups = [];

  return order;
}

/** A delivered order: the Payout step can then be the first open milestone. */
function buildDeliveredOrder(input: {
  status?: OrderStatuses
  payment?: Partial<ShopOrder['payment']>
  canceledAt?: Date
} = {}): ShopOrder {
  return buildOrder({
    ...input,
    fulfillmentStatus: FulfillmentAggregateStatuses.DELIVERED,
    progress: {
      ordered: 2, prepared: 0, dispatched: 2, delivered: 2, outstanding: 0,
    },
    shipments: [
      buildShipment({
        id: 'shipment-1',
        status: ShipmentStatuses.DELIVERED,
        dispatchedAt: new Date(2026, 0, 5, 14, 15),
        deliveredAt: new Date(2026, 0, 8, 11, 0),
      }),
    ],
  });
}

function buildPayout(input: {
  sellerPayableMinor?: number | null
  recorded?: boolean
  availableAt?: Date
  payout?: ShopOrderPayout['payout']
  method?: Partial<ShopOrderPayout['payout_method']>
} = {}): ShopOrderPayout {
  return {
    order_id: 'order-1',
    currency: 'USD',
    seller_payable_minor: input.sellerPayableMinor === undefined
      ? 2500
      : input.sellerPayableMinor,
    availability: {
      recorded: input.recorded ?? true,
      available_at: input.availableAt ?? null,
    },
    payout: input.payout ?? null,
    payout_method: {
      account_status: 'active',
      auto_payout_enabled: true,
      auto_payout_day_of_month: 5,
      next_payout_date: null,
      ...input.method,
    },
  };
}

describe('buildOrderProgressSteps', () => {
  it('marks only the new order complete while nothing is prepared', () => {
    const steps = buildOrderProgressSteps(buildOrder());

    expect(steps.map(step => step.key)).toEqual([
      'new_order',
      'pack',
      'handover',
      'in_transit',
      'delivered',
    ]);
    expect(steps[0]).toMatchObject({ state: 'completed', title: 'New order' });
    expect(steps[0].date).toBe('2 Jan 9:30');
    expect(steps[1]).toMatchObject({ state: 'active', title: 'Pack' });
    expect(steps[2]).toMatchObject({ state: 'pending' });
    expect(steps[3]).toMatchObject({ state: 'pending' });
    expect(steps[4]).toMatchObject({ state: 'pending' });
    expectStateInvariant(steps);
  });

  it('keeps packing pending before the order is paid', () => {
    const steps = buildOrderProgressSteps(buildOrder({ status: OrderStatuses.AWAITING_PAYMENT }));

    expect(stateOf(steps, 'pack')).toBe('pending');
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('completes packing with its real partial quantity and earliest preparation', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.PREPARED,
      progress: { ordered: 3, prepared: 1, outstanding: 2 },
      shipments: [
        buildShipment({
          id: 'shipment-late',
          status: ShipmentStatuses.PREPARED,
          preparedAt: new Date(2026, 0, 4, 15, 0),
        }),
        buildShipment({
          id: 'shipment-early',
          status: ShipmentStatuses.PREPARED,
          preparedAt: new Date(2026, 0, 4, 8, 0),
        }),
      ],
    }));

    const pack = steps.find(step => step.key === 'pack');

    expect(pack).toMatchObject({ state: 'completed', description: '1 of 3 prepared' });
    expect(pack?.date).toBe('4 Jan 8:00');
    expect(stateOf(steps, 'handover')).toBe('active');
    expect(stateOf(steps, 'delivered')).toBe('pending');
    expectStateInvariant(steps);
  });

  it('keeps packing complete after dispatch even though prepared drops to zero', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.SHIPPED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, outstanding: 0,
      },
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.DISPATCHED,
          dispatchedAt: new Date(2026, 0, 5, 14, 15),
        }),
      ],
    }));

    expect(steps.find(step => step.key === 'pack')).toMatchObject({
      state: 'completed',
      description: undefined,
    });
    expect(stateOf(steps, 'handover')).toBe('completed');
    expect(steps.find(step => step.key === 'handover')?.date).toBe('5 Jan 2:15');
    expect(stateOf(steps, 'in_transit')).toBe('active');
    expect(stateOf(steps, 'delivered')).toBe('pending');
    expectStateInvariant(steps);
  });

  it('completes transit from the first in-transit update', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.SHIPPED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, outstanding: 0,
      },
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.IN_TRANSIT,
          dispatchedAt: new Date(2026, 0, 5, 14, 15),
          updates: [
            { id: 'update-2', status: ShipmentStatuses.IN_TRANSIT, occurredAt: new Date(2026, 0, 6, 18, 45) },
            { id: 'update-1', status: ShipmentStatuses.IN_TRANSIT, occurredAt: new Date(2026, 0, 6, 7, 5) },
          ],
        }),
      ],
    }));

    const transit = steps.find(step => step.key === 'in_transit');

    expect(transit).toMatchObject({ state: 'completed' });
    expect(transit?.date).toBe('6 Jan 7:05');
    expect(stateOf(steps, 'delivered')).toBe('active');
    expectStateInvariant(steps);
  });

  it('closes transit from delivery evidence when no transit event exists', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
      progress: {
        ordered: 3, prepared: 0, dispatched: 2, delivered: 1, canceled: 1, outstanding: 0,
      },
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.DELIVERED,
          dispatchedAt: new Date(2026, 0, 5, 14, 15),
          deliveredAt: new Date(2026, 0, 8, 11, 0),
        }),
      ],
    }));

    expect(stateOf(steps, 'in_transit')).toBe('completed');
    expect(steps.find(step => step.key === 'delivered')).toMatchObject({
      state: 'active',
      description: '1 of 2 delivered',
    });
    expectStateInvariant(steps);
  });

  it('completes delivery only when every uncanceled unit arrived', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.DELIVERED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, delivered: 2, outstanding: 0,
      },
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.DELIVERED,
          dispatchedAt: new Date(2026, 0, 5, 14, 15),
          deliveredAt: new Date(2026, 0, 8, 11, 0),
        }),
      ],
    }));

    expect(stateOf(steps, 'in_transit')).toBe('completed');
    expect(steps.find(step => step.key === 'delivered')).toMatchObject({
      state: 'completed',
      description: undefined,
    });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('appends a failed cancellation with unfinished steps pending and nothing active', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      status: OrderStatuses.CANCELED,
      progress: {
        ordered: 2, prepared: 1, outstanding: 1, canceled: 0,
      },
      canceledAt: new Date(2026, 0, 7, 16, 20),
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.PREPARED,
          preparedAt: new Date(2026, 0, 4, 8, 0),
        }),
      ],
    }));

    expect(steps.map(step => step.key)).toEqual([
      'new_order',
      'pack',
      'handover',
      'in_transit',
      'delivered',
      'canceled',
    ]);
    expect(stateOf(steps, 'pack')).toBe('completed');
    expect(stateOf(steps, 'handover')).toBe('pending');
    expect(stateOf(steps, 'delivered')).toBe('pending');
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expect(steps.at(-1)).toMatchObject({
      key: 'canceled',
      title: 'Canceled',
      state: 'failed',
      icon: 'close',
    });
    expect(steps.at(-1)?.date).toBe('7 Jan 4:20');
    expectStateInvariant(steps);
  });

  it('treats an aggregate canceled fulfillment as canceled', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.CANCELED,
      progress: { ordered: 2, canceled: 2, outstanding: 0 },
    }));

    expect(steps.at(-1)).toMatchObject({ key: 'canceled', state: 'failed' });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('appends a completed refund without inventing a payout step', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      status: OrderStatuses.REFUNDED,
      payment: {
        refund_status: 'succeeded',
        refunded_at: new Date(2026, 0, 9, 12, 0),
      },
    }));

    expect(steps.at(-1)).toMatchObject({
      key: 'refunded',
      title: 'Refunded',
      state: 'completed',
      icon: 'refund',
    });
    expect(steps.at(-1)?.date).toBe('9 Jan 12:00');
    expect(steps.map(step => step.key)).not.toContain('payout');
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('does not let a refunded delivery keep an open milestone active', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      status: OrderStatuses.REFUNDED,
      fulfillmentStatus: FulfillmentAggregateStatuses.SHIPPED,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, outstanding: 0,
      },
      payment: {
        refund_status: 'succeeded',
        refunded_at: new Date(2026, 0, 9, 12, 0),
      },
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.DISPATCHED,
          dispatchedAt: new Date(2026, 0, 5, 14, 15),
        }),
      ],
    }));

    expect(stateOf(steps, 'in_transit')).toBe('pending');
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('derives legacy shipping from the shipped status when no shipped_at exists', () => {
    const steps = buildOrderProgressSteps(buildLegacyOrder({
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, outstanding: 0,
      },
      legacy: { status: 'shipped' },
    }));

    expect(steps.map(step => step.key)).toEqual([
      'new_order',
      'pack',
      'handover',
      'delivered',
    ]);
    expect(stateOf(steps, 'pack')).toBe('completed');
    expect(steps.find(step => step.key === 'handover')).toMatchObject({ state: 'completed' });
    expect(steps.find(step => step.key === 'handover')?.date).toBeUndefined();
    expect(stateOf(steps, 'delivered')).toBe('active');
    expectStateInvariant(steps);
  });

  it('keeps legacy transit only when the record shows it', () => {
    const inTransitSteps = buildOrderProgressSteps(buildLegacyOrder({
      legacy: { status: 'in_transit', shipped_at: new Date(2026, 0, 5, 9, 0) },
    }));
    const deliveredSteps = buildOrderProgressSteps(buildLegacyOrder({
      legacy: {
        status: 'delivered',
        shipped_at: new Date(2026, 0, 5, 9, 0),
        delivered_at: new Date(2026, 0, 8, 13, 30),
      },
    }));

    expect(inTransitSteps.find(step => step.key === 'in_transit')).toMatchObject({
      state: 'completed',
    });
    expect(inTransitSteps.find(step => step.key === 'in_transit')?.date).toBeUndefined();
    expect(stateOf(inTransitSteps, 'delivered')).toBe('active');
    expect(deliveredSteps.find(step => step.key === 'delivered')).toMatchObject({
      state: 'completed',
    });
    expect(deliveredSteps.find(step => step.key === 'delivered')?.date).toBe('8 Jan 1:30');
    expect(deliveredSteps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(inTransitSteps);
    expectStateInvariant(deliveredSteps);
  });

  it('closes legacy transit from a delivered record without a shipped_at', () => {
    const steps = buildOrderProgressSteps(buildLegacyOrder({
      legacy: { status: 'delivered', delivered_at: new Date(2026, 0, 8, 13, 30) },
    }));

    expect(steps.map(step => step.key)).toEqual([
      'new_order',
      'pack',
      'handover',
      'in_transit',
      'delivered',
    ]);
    expect(steps.every(step => step.state === 'completed')).toBe(true);
    expectStateInvariant(steps);
  });

  it('keeps legacy packing active while the record is pre-transit', () => {
    const steps = buildOrderProgressSteps(buildLegacyOrder({
      legacy: { status: 'pre_transit' },
    }));

    expect(steps.map(step => step.key)).toEqual(['new_order', 'pack', 'handover', 'delivered']);
    expect(stateOf(steps, 'pack')).toBe('active');
    expect(stateOf(steps, 'handover')).toBe('pending');
    expect(stateOf(steps, 'delivered')).toBe('pending');
    expectStateInvariant(steps);
  });

  it('cancels a legacy order with nothing in flight', () => {
    const steps = buildOrderProgressSteps(buildLegacyOrder({
      status: OrderStatuses.CANCELED,
      legacy: { status: 'pre_transit' },
    }));

    expect(steps.at(-1)).toMatchObject({ key: 'canceled', state: 'failed' });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });
});

describe('payout progress', () => {
  it('omits the payout step when Finance reports no journal basis', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({ sellerPayableMinor: null }),
    );

    expect(steps.map(step => step.key)).not.toContain('payout');
    expectStateInvariant(steps);
  });

  it('waits for availability instead of inventing a payout date', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({ recorded: false }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      title: 'Payout',
      state: 'pending',
      description: 'After delivery',
      date: undefined,
    });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('estimates the next automatic run instead of a delivery delay', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({ method: { next_payout_date: '2099-11-05' } }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      state: 'active',
      description: 'Est. 5 Nov',
      date: undefined,
    });
    expect(steps.slice(0, -1).every(step => step.state === 'completed')).toBe(true);
    expectStateInvariant(steps);
  });

  it('releases today when the next automatic run is today in UTC', () => {
    const today = new Date().toISOString().slice(0, 10);
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({ method: { next_payout_date: today } }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      state: 'active',
      description: 'Releases today',
      date: undefined,
    });
    expectStateInvariant(steps);
  });

  it('adds the money to the balance when auto payout is off', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({
        method: { auto_payout_enabled: false, next_payout_date: null },
      }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      state: 'active',
      description: 'Added to balance',
      date: undefined,
    });
    expectStateInvariant(steps);
  });

  it('asks for a bank account when the shop has no usable payout account', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({
        method: { account_status: 'missing', next_payout_date: null },
      }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      state: 'active',
      description: 'Add bank account',
      date: undefined,
    });
    expectStateInvariant(steps);
  });

  it.each(['onboarding', 'action_required'] as const)(
    'shows an account that is %s as verifying',
    (accountStatus) => {
      const steps = buildOrderProgressSteps(
        buildDeliveredOrder(),
        buildPayout({
          method: { account_status: accountStatus, next_payout_date: null },
        }),
      );

      expect(steps.at(-1)).toMatchObject({
        key: 'payout',
        state: 'active',
        description: 'Verifying account',
        date: undefined,
      });
      expectStateInvariant(steps);
    },
  );

  it.each(['restricted', 'disabled'] as const)(
    'holds the payout while the account is %s',
    (accountStatus) => {
      const steps = buildOrderProgressSteps(
        buildDeliveredOrder(),
        buildPayout({
          method: { account_status: accountStatus, next_payout_date: null },
        }),
      );

      expect(steps.at(-1)).toMatchObject({
        key: 'payout',
        state: 'active',
        description: 'On hold',
        date: undefined,
      });
      expectStateInvariant(steps);
    },
  );

  it('describes a claimed but unpaid payout as processing', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({
        payout: {
          id: 'pay-1',
          state: 'pending',
          amount_minor: 2500,
          paid_at: null,
        },
      }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      state: 'active',
      description: 'Processing',
      date: undefined,
    });
    expectStateInvariant(steps);
  });

  it('completes the payout on the day the money was paid', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({
        payout: {
          id: 'pay-1',
          state: 'paid',
          amount_minor: 2500,
          paid_at: new Date(2026, 10, 3, 9, 0),
        },
      }),
    );

    expect(steps.at(-1)).toMatchObject({
      key: 'payout',
      title: 'Payout',
      state: 'completed',
      date: 'Paid 3 Nov',
    });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('marks the payout step refunded when nothing was paid', () => {
    const steps = buildOrderProgressSteps(
      buildDeliveredOrder({
        status: OrderStatuses.REFUNDED,
        payment: {
          refund_status: 'succeeded',
          refunded_at: new Date(2026, 0, 9, 12, 0),
        },
      }),
      buildPayout(),
    );

    expect(steps.find(step => step.key === 'payout')).toMatchObject({
      state: 'pending',
      description: 'Refunded',
      date: undefined,
    });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });

  it('never shows a payout date without a scheduled run or a paid payout', () => {
    const variants: Array<Partial<ShopOrderPayout['payout_method']>> = [
      { next_payout_date: null },
      { auto_payout_enabled: false, next_payout_date: null },
      { account_status: 'missing', next_payout_date: null },
      { account_status: 'restricted', next_payout_date: null },
    ];

    for (const method of variants) {
      const steps = buildOrderProgressSteps(
        buildDeliveredOrder(),
        buildPayout({ method }),
      );

      expect(steps.find(step => step.key === 'payout')?.date).toBeUndefined();
      expectStateInvariant(steps);
    }

    const unpaidSteps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({
        payout: {
          id: 'pay-2',
          state: 'paid',
          amount_minor: 2500,
          paid_at: null,
        },
      }),
    );
    expect(unpaidSteps.find(step => step.key === 'payout')?.date).toBeUndefined();

    const unavailableSteps = buildOrderProgressSteps(
      buildDeliveredOrder(),
      buildPayout({ recorded: false }),
    );
    expect(unavailableSteps.find(step => step.key === 'payout')?.date).toBeUndefined();
  });

  it('never appends a payout step to a canceled order', () => {
    const steps = buildOrderProgressSteps(
      buildOrder({
        status: OrderStatuses.CANCELED,
        canceledAt: new Date(2026, 0, 7, 16, 20),
      }),
      buildPayout({ recorded: true }),
    );

    expect(steps.map(step => step.key)).not.toContain('payout');
    expect(steps.at(-1)).toMatchObject({ key: 'canceled', state: 'failed' });
    expect(steps.some(step => step.state === 'active')).toBe(false);
    expectStateInvariant(steps);
  });
});

describe('delivery estimate', () => {
  it('omits the estimate once the order can no longer be delivered', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      status: OrderStatuses.CANCELED,
      canceledAt: new Date(2026, 0, 7, 16, 20),
    }));

    expect(steps.find(step => step.key === 'delivered')?.date).toBeUndefined();
  });

  it('shows the accepted latest delivery date while Delivered is open', () => {
    const steps = buildOrderProgressSteps(buildOrder());

    expect(steps.find(step => step.key === 'delivered')).toMatchObject({
      state: 'pending',
      date: 'Est. 9 Jan',
    });
    expectStateInvariant(steps);
  });

  it('prefers the accepted estimate snapshot over the legacy record', () => {
    // Test fixture: only the estimate field the progress reads is relevant.
    const acceptedShipping = {
      estimate: { latest_delivery_date: new Date(2026, 9, 31) },
    } as ShopOrder['shipping'];

    const steps = buildOrderProgressSteps(buildOrder({ shipping: acceptedShipping }));

    expect(steps.find(step => step.key === 'delivered')?.date).toBe('Est. 31 Oct');
  });

  it('omits the estimate when no delivery date was ever accepted', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      legacy: { estimated_delivery: undefined },
    }));

    expect(steps.find(step => step.key === 'delivered')?.date).toBeUndefined();
    expectStateInvariant(steps);
  });

  it('shows the real delivery timestamp instead of the estimate', () => {
    const steps = buildOrderProgressSteps(buildOrder({
      fulfillmentStatus: FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
      progress: {
        ordered: 3, prepared: 0, dispatched: 2, delivered: 1, canceled: 1, outstanding: 0,
      },
      shipments: [
        buildShipment({
          id: 'shipment-1',
          status: ShipmentStatuses.DELIVERED,
          dispatchedAt: new Date(2026, 0, 5, 14, 15),
          deliveredAt: new Date(2026, 0, 8, 11, 0),
        }),
      ],
    }));

    expect(steps.find(step => step.key === 'delivered')).toMatchObject({
      state: 'active',
      date: '8 Jan 11:00',
    });
    expectStateInvariant(steps);
  });
});

describe('formatProgressTimestamp', () => {
  it('omits missing timestamps instead of inventing them', () => {
    expect(formatProgressTimestamp(undefined)).toBeUndefined();
    expect(formatProgressTimestamp(null)).toBeUndefined();
  });

  it('formats a concise progress label without a year or meridiem', () => {
    expect(formatProgressTimestamp(new Date(2026, 0, 2, 9, 30))).toBe('2 Jan 9:30');
    expect(formatProgressTimestamp(new Date(2026, 9, 27, 19, 41))).toBe('27 Oct 7:41');
  });
});
