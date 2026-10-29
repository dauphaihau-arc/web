import { describe, expect, it } from 'vitest';
import type { TimelineItem, TimelineItemState } from '@arc/ui/patterns/timeline.vue';
import type {
  AdminOrderDetailOrder,
  AdminOrderFinancialBreakdown,
  AdminOrderFulfillmentGroup,
  AdminOrderFulfillmentProgress,
  AdminOrderFulfillmentSummary,
  AdminOrderPayoutMethod,
  AdminOrderShipment,
} from '~/domains/orders/api/contracts/admin-orders.contract';
import { useAdminOrderProgress } from './use-admin-order-progress';

const TERMINAL_KEYS = ['canceled', 'refunded'];
/** A pinned clock so schedule labels never depend on the day the suite runs. */
const NOW = new Date('2026-10-29T12:00:00.000Z');
/** Concise progress timestamps: day, abbreviated month, 12-hour time, no year. */
const CONCISE_DATE = /^\d{1,2} [A-Z][a-z]{2} \d{1,2}:\d{2}$/;

function makeProgress(overrides: Partial<AdminOrderFulfillmentProgress> = {}): AdminOrderFulfillmentProgress {
  return {
    ordered: 3,
    prepared: 0,
    dispatched: 0,
    delivered: 0,
    canceled: 0,
    outstanding: 3,
    ...overrides,
  };
}

function makeShipment(overrides: Partial<AdminOrderShipment> = {}): AdminOrderShipment {
  return {
    id: 'shipment-1',
    group_id: 'group-1',
    status: 'dispatched',
    origin_countries: ['US'],
    prepared_at: '2026-01-02T10:00:00Z',
    dispatched_at: '2026-01-03T10:00:00Z',
    created_at: '2026-01-02T09:00:00Z',
    updated_at: '2026-01-03T10:00:00Z',
    items: [],
    updates: [],
    ...overrides,
  };
}

function makeGroup(
  progress: AdminOrderFulfillmentProgress,
  shipments: AdminOrderShipment[],
): AdminOrderFulfillmentGroup {
  return {
    id: 'group-1',
    method: 'seller',
    operator: 'seller',
    provenance: 'order',
    items: [],
    progress,
    shipments,
  };
}

function makeFulfillment(
  progress: AdminOrderFulfillmentProgress,
  shipments: AdminOrderShipment[] = [],
  overrides: Partial<AdminOrderFulfillmentSummary> = {},
): AdminOrderFulfillmentSummary {
  return {
    status: 'unfulfilled',
    requires_reconciliation: false,
    progress,
    groups: [makeGroup(progress, shipments)],
    legacy_shipping: {
      status: 'pre_transit',
      updated_at: '2026-01-01T10:00:00Z',
      to_country: 'US',
      from_countries: ['US'],
    },
    ...overrides,
  };
}

function makeLegacyFulfillment(
  progress: AdminOrderFulfillmentProgress,
  overrides: Partial<AdminOrderFulfillmentSummary['legacy_shipping']> = {},
): AdminOrderFulfillmentSummary {
  return {
    status: 'unfulfilled',
    requires_reconciliation: false,
    progress,
    groups: [],
    legacy_shipping: {
      status: 'pre_transit',
      updated_at: '2026-01-01T10:00:00Z',
      to_country: 'US',
      from_countries: ['US'],
      ...overrides,
    },
  };
}

function makeOrder(overrides: Partial<AdminOrderDetailOrder> = {}): AdminOrderDetailOrder {
  return {
    id: 'order-1',
    order_number: '1001',
    shop: { id: 'shop-1', shop_name: 'Demo shop', slug: 'demo-shop' },
    customer: { email: 'buyer@example.com' },
    payment: { type: 'card', details: null },
    status: 'paid',
    products: [],
    promo_codes: [],
    fulfillment: makeFulfillment(makeProgress()),
    shipping_address: {
      full_name: 'Buyer',
      address1: '1 Main St',
      city: 'Springfield',
      country: 'US',
      state: 'IL',
      zip: '62701',
      phone: '',
    },
    created_at: '2026-01-01T10:00:00Z',
    currency: 'USD',
    subtotal_minor: 3000,
    shipping_minor: 0,
    discount_minor: 0,
    sale_discount_minor: 0,
    total_minor: 3000,
    ...overrides,
  };
}

function makePayoutMethod(
  overrides: Partial<AdminOrderPayoutMethod> = {},
): AdminOrderPayoutMethod {
  return {
    account_status: 'active',
    auto_payout_enabled: true,
    auto_payout_day_of_month: 5,
    next_payout_date: '2026-11-05',
    ...overrides,
  };
}

function makeBreakdown(
  overrides: Partial<AdminOrderFinancialBreakdown> = {},
): AdminOrderFinancialBreakdown {
  return {
    order_id: 'order-1',
    currency: 'USD',
    platform_commission_minor: 300,
    seller_payable_minor: 2500,
    availability: { recorded: true, available_at: '2026-11-02T10:00:00Z' },
    payout: null,
    payout_method: makePayoutMethod(),
    ...overrides,
  };
}

function deliveredOrder(overrides: Partial<AdminOrderDetailOrder> = {}): AdminOrderDetailOrder {
  const progress = makeProgress({
    prepared: 3, dispatched: 3, delivered: 3, outstanding: 0,
  });

  return makeOrder({
    status: 'completed',
    fulfillment: makeFulfillment(progress, [
      makeShipment({ status: 'delivered', delivered_at: '2026-11-06T10:00:00Z' }),
    ]),
    ...overrides,
  });
}

function stepsOf(
  order: AdminOrderDetailOrder,
  breakdown?: AdminOrderFinancialBreakdown,
) {
  return useAdminOrderProgress(order, breakdown, NOW).value;
}

function step(
  order: AdminOrderDetailOrder,
  key: string,
  breakdown?: AdminOrderFinancialBreakdown,
): TimelineItem {
  const match = stepsOf(order, breakdown).find(item => item.key === key);

  if (!match) {
    throw new Error(`Missing step ${key}`);
  }

  return match;
}

function stateOf(
  order: AdminOrderDetailOrder,
  key: string,
  breakdown?: AdminOrderFinancialBreakdown,
): TimelineItemState {
  return step(order, key, breakdown).state ?? 'pending';
}

/**
 * The ladder invariant: completed milestones form a prefix, at most one
 * milestone is active, everything after it is pending, terminal milestones are
 * appended at the end, and a terminal outcome leaves no active milestone.
 */
function expectLadderInvariant(steps: TimelineItem[]) {
  const ladder = steps.filter(item => !TERMINAL_KEYS.includes(item.key ?? ''));
  const states = ladder.map(item => item.state ?? 'pending');

  expect(states.filter(state => state === 'active').length).toBeLessThanOrEqual(1);

  const activeIndex = states.indexOf('active');
  const failedIndex = states.indexOf('failed');
  const boundary = states.findIndex(state => state !== 'completed');
  const prefixEnd = boundary === -1 ? states.length : boundary;

  expect(states.slice(0, prefixEnd).every(state => state === 'completed')).toBe(true);

  if (failedIndex !== -1) {
    expect(states.filter(state => state === 'failed')).toHaveLength(1);
  }

  const tailStart = activeIndex !== -1
    ? activeIndex + 1
    : failedIndex !== -1 ? failedIndex + 1 : states.length;

  expect(states.slice(tailStart).every(state => state === 'pending')).toBe(true);

  const firstTerminal = steps.findIndex(item => TERMINAL_KEYS.includes(item.key ?? ''));

  if (firstTerminal !== -1) {
    expect(steps.slice(firstTerminal).every(item => TERMINAL_KEYS.includes(item.key ?? ''))).toBe(true);
    expect(steps.some(item => item.state === 'active')).toBe(false);
  }
}

describe('useAdminOrderProgress', () => {
  it('returns no steps without an order', () => {
    expect(useAdminOrderProgress(undefined).value).toEqual([]);
  });

  it('keeps an unpaid order at payment with every fulfillment milestone pending', () => {
    const order = makeOrder({
      status: 'awaiting_payment',
      fulfillment: makeFulfillment(makeProgress()),
    });
    const steps = stepsOf(order);

    expect(steps.map(item => item.key)).toEqual([
      'created',
      'paid',
      'prepared',
      'dispatched',
      'in_transit',
      'delivered',
    ]);
    expect(step(order, 'created')).toMatchObject({
      title: 'Order created',
      state: 'completed',
      icon: 'orders',
    });
    expect(step(order, 'created').date).toMatch(CONCISE_DATE);
    expect(step(order, 'prepared').date).toBeUndefined();
    expect(stateOf(order, 'paid')).toBe('active');
    expect(stateOf(order, 'prepared')).toBe('pending');
    expect(stateOf(order, 'dispatched')).toBe('pending');
    expect(stateOf(order, 'in_transit')).toBe('pending');
    expect(stateOf(order, 'delivered')).toBe('pending');
    expectLadderInvariant(steps);
  });

  it('marks an unfulfilled paid order at preparation', () => {
    const order = makeOrder({ fulfillment: makeFulfillment(makeProgress()) });

    expect(stateOf(order, 'paid')).toBe('completed');
    expect(step(order, 'prepared')).toMatchObject({
      state: 'active',
    });
    expect(stateOf(order, 'dispatched')).toBe('pending');
    expect(stateOf(order, 'in_transit')).toBe('pending');
    expect(stateOf(order, 'delivered')).toBe('pending');
    expectLadderInvariant(stepsOf(order));
  });

  it('completes preparation once units are prepared and states real counts', () => {
    const progress = makeProgress({ prepared: 2, outstanding: 1 });
    const order = makeOrder({ fulfillment: makeFulfillment(progress) });

    expect(stateOf(order, 'paid')).toBe('completed');
    expect(step(order, 'prepared')).toMatchObject({
      state: 'completed',
    });
    expect(step(order, 'dispatched')).toMatchObject({
      state: 'active',
    });
    expect(stateOf(order, 'in_transit')).toBe('pending');
    expect(stateOf(order, 'delivered')).toBe('pending');
    expectLadderInvariant(stepsOf(order));
  });

  it('keeps transit active while a dispatched shipment has no transit event', () => {
    const progress = makeProgress({ prepared: 2, dispatched: 1, outstanding: 2 });
    const order = makeOrder({ fulfillment: makeFulfillment(progress, [makeShipment()]) });

    expect(stateOf(order, 'prepared')).toBe('completed');
    expect(step(order, 'dispatched')).toMatchObject({
      state: 'completed',
    });
    expect(stateOf(order, 'in_transit')).toBe('active');
    expect(stateOf(order, 'delivered')).toBe('pending');
    expect(step(order, 'prepared').date).toMatch(CONCISE_DATE);
    expect(step(order, 'dispatched').date).toMatch(CONCISE_DATE);
    expect(step(order, 'in_transit').date).toBeUndefined();
    expectLadderInvariant(stepsOf(order));
  });

  it('completes transit when a non-voided shipment reports in transit', () => {
    const progress = makeProgress({ prepared: 3, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [makeShipment({ status: 'in_transit' })]),
    });

    expect(step(order, 'in_transit')).toMatchObject({
      state: 'completed',
    });
    expect(stateOf(order, 'delivered')).toBe('active');
    expectLadderInvariant(stepsOf(order));
  });

  it('completes transit from a recorded shipment update', () => {
    const progress = makeProgress({ prepared: 3, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [
        makeShipment({
          status: 'dispatched',
          updates: [
            {
              id: 'update-1',
              status: 'in_transit',
              actor_type: 'seller',
              occurred_at: '2026-01-04T10:00:00Z',
            },
          ],
        }),
      ]),
    });

    expect(step(order, 'in_transit')).toMatchObject({
      state: 'completed',
    });
    expect(step(order, 'in_transit').date).toMatch(CONCISE_DATE);
    expect(stateOf(order, 'delivered')).toBe('active');
    expectLadderInvariant(stepsOf(order));
  });

  it('ignores transit updates on a voided shipment', () => {
    const progress = makeProgress({ prepared: 3, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [
        makeShipment({
          status: 'voided',
          updates: [
            {
              id: 'update-1',
              status: 'in_transit',
              actor_type: 'seller',
              occurred_at: '2026-01-04T10:00:00Z',
            },
          ],
        }),
      ]),
    });

    expect(stateOf(order, 'in_transit')).toBe('active');
    expect(stateOf(order, 'delivered')).toBe('pending');
    expectLadderInvariant(stepsOf(order));
  });

  it('completes transit and delivery when every deliverable unit arrives', () => {
    const progress = makeProgress({
      prepared: 3, dispatched: 3, delivered: 3, outstanding: 0,
    });
    const order = makeOrder({
      status: 'completed',
      fulfillment: makeFulfillment(progress, [makeShipment({ status: 'delivered', delivered_at: '2026-01-06T10:00:00Z' })]),
    });

    expect(stateOf(order, 'paid')).toBe('completed');
    expect(stateOf(order, 'in_transit')).toBe('completed');
    expect(step(order, 'delivered')).toMatchObject({
      state: 'completed',
    });
    expect(step(order, 'delivered').date).toMatch(CONCISE_DATE);
    expectLadderInvariant(stepsOf(order));
  });

  it('completes transit from delivery evidence even without a transit event', () => {
    const progress = makeProgress({
      prepared: 3, dispatched: 3, delivered: 3, outstanding: 0,
    });
    const order = makeOrder({
      status: 'completed',
      fulfillment: makeFulfillment(progress, [makeShipment({ status: 'delivered', delivered_at: '2026-01-06T10:00:00Z' })]),
    });
    const steps = stepsOf(order);

    expect(steps.map(item => item.key)).toEqual([
      'created',
      'paid',
      'prepared',
      'dispatched',
      'in_transit',
      'delivered',
    ]);
    expect(steps.every(item => item.state !== 'active')).toBe(true);
    expectLadderInvariant(steps);
  });

  it('keeps delivery active while only part of the order arrives', () => {
    const progress = makeProgress({
      prepared: 3, dispatched: 3, delivered: 1, outstanding: 2,
    });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [makeShipment({ status: 'delivered', delivered_at: '2026-01-06T10:00:00Z' })]),
    });

    expect(stateOf(order, 'in_transit')).toBe('completed');
    expect(step(order, 'delivered')).toMatchObject({
      state: 'active',
    });
    expectLadderInvariant(stepsOf(order));
  });

  it('excludes canceled units from every fulfillment denominator', () => {
    const progress = makeProgress({
      prepared: 2, dispatched: 2, delivered: 2, canceled: 1, outstanding: 0,
    });
    const order = makeOrder({
      status: 'completed',
      fulfillment: makeFulfillment(progress, [makeShipment({ status: 'delivered', delivered_at: '2026-01-06T10:00:00Z' })]),
    });

    expect(step(order, 'prepared')).toMatchObject({ state: 'completed' });
    expect(step(order, 'dispatched')).toMatchObject({ state: 'completed' });
    expect(step(order, 'delivered')).toMatchObject({ state: 'completed' });
    expectLadderInvariant(stepsOf(order));
  });

  it('fails payment and leaves no active step on a canceled order', () => {
    const order = makeOrder({
      status: 'canceled',
      canceled_at: '2026-01-05T10:00:00Z',
      cancel_reason: 'Fraud review',
    });
    const steps = stepsOf(order);

    expect(stateOf(order, 'paid')).toBe('failed');
    expect(steps.at(-1)).toMatchObject({
      key: 'canceled',
      title: 'Canceled',
      state: 'failed',
      icon: 'close',
    });
    expect(steps.at(-1)?.date).toMatch(CONCISE_DATE);
    expect(steps.every(item => item.state !== 'active')).toBe(true);
    expect(stateOf(order, 'delivered')).toBe('pending');
    expectLadderInvariant(steps);
  });

  it('keeps completed milestones without an active step after a partially fulfilled cancellation', () => {
    const progress = makeProgress({ prepared: 2, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      status: 'canceled',
      canceled_at: '2026-01-05T10:00:00Z',
      fulfillment: makeFulfillment(progress, [makeShipment()]),
    });
    const steps = stepsOf(order);

    expect(stateOf(order, 'paid')).toBe('completed');
    expect(stateOf(order, 'prepared')).toBe('completed');
    expect(stateOf(order, 'dispatched')).toBe('completed');
    expect(stateOf(order, 'in_transit')).toBe('pending');
    expect(stateOf(order, 'delivered')).toBe('pending');
    expect(steps.every(item => item.state !== 'active')).toBe(true);
    expectLadderInvariant(steps);
  });

  it('settles payment and appends a completed refund milestone', () => {
    const order = makeOrder({
      status: 'refunded',
      refunded_at: '2026-01-06T10:00:00Z',
    });
    const steps = stepsOf(order);

    expect(stateOf(order, 'paid')).toBe('completed');
    expect(steps.at(-1)).toMatchObject({
      key: 'refunded',
      title: 'Refunded',
      state: 'completed',
      icon: 'refund',
    });
    expect(steps.at(-1)?.date).toMatch(CONCISE_DATE);
    expect(steps.every(item => item.state !== 'active')).toBe(true);
    expectLadderInvariant(steps);
  });

  it('treats an archived order as settled without inventing a refund', () => {
    const order = makeOrder({ status: 'archived' });
    const steps = stepsOf(order);

    expect(stateOf(order, 'paid')).toBe('completed');
    expect(steps.some(item => item.key === 'refunded')).toBe(false);
    expect(steps.every(item => item.state !== 'active')).toBe(true);
    expectLadderInvariant(steps);
  });

  it('attaches the reconciliation warning to the furthest reached operational step', () => {
    const progress = makeProgress({ prepared: 2, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [makeShipment()], { requires_reconciliation: true }),
    });

    expect(step(order, 'in_transit')).toMatchObject({
      state: 'active',
      description: 'Fulfillment needs reconciliation',
    });
    expect(stepsOf(order).some(item => item.key === 'reconciliation')).toBe(false);
    expectLadderInvariant(stepsOf(order));
  });

  it('completes dispatch for a legacy record that reports a shipped status without a timestamp', () => {
    const order = makeOrder({
      fulfillment: makeLegacyFulfillment(
        makeProgress({ prepared: 3, dispatched: 3, outstanding: 0 }),
        { status: 'shipped', updated_at: '2026-01-04T10:00:00Z' },
      ),
    });

    const steps = stepsOf(order);
    expect(steps.map(item => item.key)).toEqual(['created', 'paid', 'prepared', 'dispatched', 'delivered']);
    expect(stateOf(order, 'prepared')).toBe('completed');
    expect(stateOf(order, 'dispatched')).toBe('completed');
    expect(stateOf(order, 'delivered')).toBe('active');
    expectLadderInvariant(steps);
  });

  it('maps a legacy shipping record without inventing transit', () => {
    const order = makeOrder({
      fulfillment: makeLegacyFulfillment(
        makeProgress({ prepared: 3, dispatched: 3, outstanding: 0 }),
        {
          status: 'shipped',
          updated_at: '2026-01-04T10:00:00Z',
          shipped_at: '2026-01-03T10:00:00Z',
        },
      ),
    });

    const steps = stepsOf(order);
    expect(steps.map(item => item.key)).toEqual(['created', 'paid', 'prepared', 'dispatched', 'delivered']);
    expect(stateOf(order, 'dispatched')).toBe('completed');
    expect(stateOf(order, 'delivered')).toBe('active');
    expectLadderInvariant(steps);
  });

  it('completes delivery for a legacy shipping record with a delivery timestamp', () => {
    const order = makeOrder({
      status: 'completed',
      fulfillment: makeLegacyFulfillment(
        makeProgress({
          ordered: 3, prepared: 3, dispatched: 3, delivered: 3, outstanding: 0,
        }),
        {
          status: 'delivered',
          updated_at: '2026-01-06T10:00:00Z',
          shipped_at: '2026-01-03T10:00:00Z',
          delivered_at: '2026-01-06T10:00:00Z',
        },
      ),
    });

    expect(step(order, 'delivered')).toMatchObject({ state: 'completed' });
    expectLadderInvariant(stepsOf(order));
  });

  it('dates an unreached Delivered step with the accepted estimate', () => {
    const progress = makeProgress({ prepared: 2, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [makeShipment()]),
      shipping: { estimate: { latest_delivery_date: '2026-10-31T00:00:00.000Z' } },
    });

    expect(stateOf(order, 'delivered')).toBe('pending');
    expect(step(order, 'delivered').date).toBe('Est. 31 Oct');
    expectLadderInvariant(stepsOf(order));
  });

  it('falls back to the legacy shipping estimate for the Delivered step', () => {
    const order = makeOrder({
      fulfillment: makeLegacyFulfillment(
        makeProgress({ prepared: 3, dispatched: 3, outstanding: 0 }),
        {
          status: 'shipped',
          updated_at: '2026-01-04T10:00:00Z',
          shipped_at: '2026-01-03T10:00:00Z',
          estimated_delivery: '2026-10-31T00:00:00.000Z',
        },
      ),
    });

    expect(step(order, 'delivered').date).toBe('Est. 31 Oct');
    expectLadderInvariant(stepsOf(order));
  });

  it('omits the estimate when the quote carries no delivery estimate', () => {
    const progress = makeProgress({ prepared: 2, dispatched: 1, outstanding: 2 });
    const order = makeOrder({
      fulfillment: makeFulfillment(progress, [makeShipment()]),
      shipping: { estimate: {} },
    });

    expect(step(order, 'delivered').date).toBeUndefined();
    expectLadderInvariant(stepsOf(order));
  });

  it('prefers the actual delivery timestamp over the accepted estimate', () => {
    const progress = makeProgress({
      prepared: 3, dispatched: 3, delivered: 3, outstanding: 0,
    });
    const order = makeOrder({
      status: 'completed',
      shipping: { estimate: { latest_delivery_date: '2026-10-31T00:00:00.000Z' } },
      fulfillment: makeFulfillment(progress, [
        makeShipment({ status: 'delivered', delivered_at: '2026-11-06T10:00:00Z' }),
      ]),
    });

    expect(step(order, 'delivered')).toMatchObject({ state: 'completed' });
    expect(step(order, 'delivered').date).toMatch(CONCISE_DATE);
    expectLadderInvariant(stepsOf(order));
  });
});

describe('useAdminOrderProgress payout state', () => {
  it('omits the payout milestone when the order has no paid journal basis', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({ seller_payable_minor: null });

    expect(stepsOf(order, breakdown).some(item => item.key === 'payout')).toBe(false);
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('omits the payout milestone while the financial breakdown is unavailable', () => {
    const order = deliveredOrder();

    expect(stepsOf(order).some(item => item.key === 'payout')).toBe(false);
    expectLadderInvariant(stepsOf(order));
  });

  it('keeps the payout pending until availability is recorded', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      availability: { recorded: false, available_at: null },
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      title: 'Payout',
      state: 'pending',
      description: 'After delivery',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('asks for a payout account instead of promising a schedule', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ account_status: 'missing' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Add bank account',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('reports an account still onboarding as being verified', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ account_status: 'onboarding' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Verifying account',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('reports an account needing seller action as being verified', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ account_status: 'action_required' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Verifying account',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('holds the payout while the payout account is restricted', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ account_status: 'restricted', next_payout_date: null }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'On hold',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('holds the payout while the payout account is disabled', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ account_status: 'disabled', next_payout_date: null }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'On hold',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('credits the wallet balance when automatic payouts are off', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({
        auto_payout_enabled: false,
        next_payout_date: null,
      }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Added to balance',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('releases today when the next automatic run is today in UTC', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ next_payout_date: '2026-10-29' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Releases today',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('estimates the next automatic run with its UTC day', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ next_payout_date: '2026-11-05' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Est. 5 Nov',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('never invents a run date when Finance reports none', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ next_payout_date: null }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Processing',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('keeps the payout pending on a terminal order with a known run date', () => {
    const order = deliveredOrder({ status: 'archived' });
    const breakdown = makeBreakdown({ payout: null });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'pending',
      description: 'Est. 5 Nov',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('never activates a blocked account on a terminal order', () => {
    const order = deliveredOrder({ status: 'archived' });
    const breakdown = makeBreakdown({
      payout_method: makePayoutMethod({ account_status: 'missing' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'pending',
      description: 'Add bank account',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('marks a claimed but unprocessed payout as processing', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout: {
        id: 'pay_1', state: 'pending', amount_minor: 2500, paid_at: null,
      },
      payout_method: makePayoutMethod({ account_status: 'missing' }),
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'active',
      description: 'Processing',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('keeps a refunded order without a paid payout refunded', () => {
    const order = deliveredOrder({ status: 'refunded', refunded_at: '2026-11-02T10:00:00Z' });
    const breakdown = makeBreakdown({ payout: null });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'pending',
      description: 'Refunded',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('completes the payout with the paid day', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout: {
        id: 'pay_1',
        state: 'paid',
        amount_minor: 2500,
        paid_at: '2026-11-03T09:00:00.000Z',
      },
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'completed',
      date: 'Paid 3 Nov',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('keeps a paid payout settled on a refunded order', () => {
    const order = deliveredOrder({ status: 'refunded', refunded_at: '2026-11-02T10:00:00Z' });
    const breakdown = makeBreakdown({
      payout: {
        id: 'pay_1',
        state: 'paid',
        amount_minor: 2500,
        paid_at: '2026-11-03T09:00:00.000Z',
      },
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({
      state: 'completed',
      date: 'Paid 3 Nov',
    });
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('never renders a payout date without a paid timestamp', () => {
    const order = deliveredOrder();
    const breakdown = makeBreakdown({
      payout: {
        id: 'pay_1', state: 'paid', amount_minor: 2500, paid_at: null,
      },
    });

    expect(step(order, 'payout', breakdown)).toMatchObject({ state: 'completed' });
    expect(step(order, 'payout', breakdown).date).toBeUndefined();
    expectLadderInvariant(stepsOf(order, breakdown));
  });

  it('omits the payout milestone on a canceled order even with recorded availability', () => {
    const order = makeOrder({
      status: 'canceled',
      canceled_at: '2026-11-01T10:00:00Z',
    });
    const breakdown = makeBreakdown({
      payout: {
        id: 'pay_1', state: 'pending', amount_minor: 2500, paid_at: null,
      },
    });
    const steps = stepsOf(order, breakdown);

    expect(steps.some(item => item.key === 'payout')).toBe(false);
    expect(steps.every(item => item.state !== 'active')).toBe(true);
    expectLadderInvariant(steps);
  });
});
