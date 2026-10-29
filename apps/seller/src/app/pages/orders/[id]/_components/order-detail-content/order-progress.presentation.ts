import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import type { TimelineItem, TimelineItemState } from '@arc/ui/patterns/timeline.vue';
import type { ShopOrderPayout } from '~/domains/shop/api/finance/contracts/order-payout.contract';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

type Shipment = ShopOrder['fulfillment']['groups'][number]['shipments'][number];

dayjs.extend(utc);

const PAID_STATUSES: OrderStatuses[] = [
  OrderStatuses.PAID,
  OrderStatuses.COMPLETED,
  OrderStatuses.REFUNDED,
];

/** Legacy order-level statuses that prove the parcel left the seller. */
const LEGACY_SHIPPED_STATUSES = ['shipped', 'in_transit', 'delivered'];

/**
 * One operational milestone plus the evidence that closes it. States are
 * derived afterwards from the completed prefix so a later milestone can never
 * be completed while an earlier one is still open.
 */
type Milestone = {
  key: string
  title: string
  icon: string
  date?: string
  description?: string
  done: boolean

  /** Never becomes the single active step; it can only wait. */
  blocked?: boolean
};

/** Concise delivery estimate shown while the Delivered step is still open. */
export function formatProgressEstimate(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  return `Est. ${dayjs(value).format('D MMM')}`;
}

/** Concise progress label: day before month, 12-hour time, no year or suffix. */
export function formatProgressTimestamp(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  return dayjs(value).format('D MMM h:mm');
}

function earliest(value?: Array<Date | string | undefined>): Date | string | undefined {
  if (!value) return undefined;

  const instants = value
    .filter((entry): entry is Date | string => Boolean(entry))
    .map(entry => new Date(entry))
    .sort((left, right) => left.getTime() - right.getTime());

  return instants[0];
}

/**
 * Voided consignments are retained as history; their preparation, dispatch and
 * journey facts no longer describe where the order stands.
 */
function liveShipments(order: ShopOrder): Shipment[] {
  return order.fulfillment.groups
    .flatMap(group => group.shipments)
    .filter(shipment => shipment.status !== ShipmentStatuses.VOIDED);
}

function partialHint(done: number, total: number, verb: string): string | undefined {
  if (done <= 0 || done >= total) return undefined;
  return `${done} of ${total} ${verb}`;
}

/**
 * States come from the completed prefix: everything before the first open
 * milestone is completed, the first open one is active while the order is in
 * flight, and the rest stay pending. This keeps exactly one active step and
 * never completes a milestone behind it.
 */
function resolveMilestones(milestones: Milestone[], activeAllowed: boolean): TimelineItem[] {
  const firstOpen = milestones.findIndex(milestone => !milestone.done);

  return milestones.map((milestone, index) => {
    let state: TimelineItemState = 'pending';

    if (firstOpen === -1 || index < firstOpen) state = 'completed';
    else if (index === firstOpen && activeAllowed && !milestone.blocked) state = 'active';

    return {
      key: milestone.key,
      title: milestone.title,
      icon: milestone.icon,
      date: milestone.date,
      description: milestone.description,
      state,
    };
  });
}

/**
 * Operational seller milestones for one order. Quantity-based progress decides
 * the fulfillment steps; the shipment journey only adds transit evidence. The
 * payout fact, when Finance has one, closes the ladder after delivery.
 */
export function buildOrderProgressSteps(
  order: ShopOrder,
  orderPayout?: ShopOrderPayout | null,
): TimelineItem[] {
  const progress = order.fulfillment.progress;
  const total = progress.ordered - progress.canceled;
  const refunded = order.payment.refund_status === 'succeeded';
  const canceled = order.status === OrderStatuses.CANCELED
    || order.fulfillment.status === FulfillmentAggregateStatuses.CANCELED;
  const paid = PAID_STATUSES.includes(order.status);
  const activeAllowed = paid && !canceled && !refunded;

  const milestones: Milestone[] = [
    {
      key: 'new_order',
      title: 'New order',
      icon: 'orders',
      date: formatProgressTimestamp(order.created_at),
      done: true,
    },
  ];

  if (order.fulfillment.groups.length === 0) {
    milestones.push(...legacyMilestones(order));
  }
  else {
    milestones.push(...shipmentMilestones(order, total));
  }

  // Canceled orders never reach payout. Otherwise, Finance facts decide
  // whether a Payout step exists, including a refund when no transfer was paid.
  const payout = canceled ? undefined : payoutMilestone(orderPayout, refunded);
  if (payout) milestones.push(payout);

  const steps = resolveMilestones(milestones, activeAllowed);

  if (canceled) {
    for (const step of steps) {
      if (step.state !== 'completed') step.state = 'pending';
    }

    steps.push({
      key: 'canceled',
      title: 'Canceled',
      state: 'failed',
      icon: 'close',
      date: formatProgressTimestamp(order.canceled_at),
    });
  }

  if (refunded) {
    steps.push({
      key: 'refunded',
      title: 'Refunded',
      state: 'completed',
      icon: 'refund',
      date: formatProgressTimestamp(order.payment.refunded_at),
    });
  }

  return steps;
}

function shipmentMilestones(order: ShopOrder, total: number): Milestone[] {
  const progress = order.fulfillment.progress;
  const shipments = liveShipments(order);
  const transitUpdates = shipments.flatMap(shipment =>
    shipment.updates.filter(update => update.status === ShipmentStatuses.IN_TRANSIT),
  );

  // `dispatched` already counts in-transit and delivered units, so any dispatch
  // evidence proves preparation finished even after `prepared` drops back to 0.
  const dispatched = progress.dispatched > 0;
  const delivered = progress.delivered > 0;
  const hasTransitEvidence = transitUpdates.length > 0
    || shipments.some(shipment => shipment.status === ShipmentStatuses.IN_TRANSIT);
  const fullyDelivered = total > 0 && progress.delivered >= total;

  return [
    {
      key: 'pack',
      title: 'Pack',
      icon: 'product',
      date: formatProgressTimestamp(earliest(shipments.map(shipment => shipment.prepared_at))),
      description: partialHint(progress.prepared, total, 'prepared'),
      done: progress.prepared > 0 || dispatched || delivered,
    },
    {
      key: 'handover',
      title: 'Handover',
      icon: 'shipping',
      date: formatProgressTimestamp(earliest(shipments.map(shipment => shipment.dispatched_at))),
      done: dispatched,
    },
    {
      key: 'in_transit',
      title: 'In transit',
      icon: 'transit',
      date: formatProgressTimestamp(earliest(transitUpdates.map(update => update.occurred_at))),
      // Delivery may follow dispatch directly, so delivered units also close
      // the transit leg.
      done: hasTransitEvidence || delivered,
    },
    {
      key: 'delivered',
      title: 'Delivered',
      icon: 'delivered',
      date: deliveredStepDate(
        order,
        earliest(shipments.map(shipment => shipment.delivered_at)),
        fullyDelivered,
      ),
      description: partialHint(progress.delivered, total, 'delivered'),
      done: fullyDelivered,
    },
  ];
}

/**
 * Legacy orders carry a single order-level shipping record instead of shipment
 * groups; only the facts that record actually holds become milestones.
 */
function legacyMilestones(order: ShopOrder): Milestone[] {
  const legacy = order.fulfillment.legacy_shipping;
  const progress = order.fulfillment.progress;
  const shipped = Boolean(legacy.shipped_at) || LEGACY_SHIPPED_STATUSES.includes(legacy.status);
  const delivered = Boolean(legacy.delivered_at) || legacy.status === 'delivered';
  // Delivery is only reachable through transit, so a delivered record closes
  // the transit leg even when the intermediate status was never recorded.
  const transitDone = legacy.status === 'in_transit' || delivered;

  const milestones: Milestone[] = [
    {
      key: 'pack',
      title: 'Pack',
      icon: 'product',
      description: partialHint(progress.prepared, progress.ordered - progress.canceled, 'prepared'),
      done: shipped,
    },
    {
      key: 'handover',
      title: 'Handover',
      icon: 'shipping',
      date: formatProgressTimestamp(legacy.shipped_at),
      done: shipped,
    },
  ];

  // Legacy shipping carries no transit timestamp: show the milestone only when
  // the record actually reached transit or delivery.
  if (transitDone) {
    milestones.push({
      key: 'in_transit',
      title: 'In transit',
      icon: 'transit',
      done: true,
    });
  }

  milestones.push({
    key: 'delivered',
    title: 'Delivered',
    icon: 'delivered',
    date: deliveredStepDate(order, legacy.delivered_at, delivered),
    done: delivered,
  });

  return milestones;
}

/**
 * The accepted delivery estimate closes an open Delivered step; a real delivery
 * timestamp always wins and an absent estimate is simply omitted.
 */
function deliveredStepDate(
  order: ShopOrder,
  actual: Date | string | undefined,
  done: boolean,
): string | undefined {
  const actualLabel = formatProgressTimestamp(actual);
  if (actualLabel) return actualLabel;

  const canceled = order.status === OrderStatuses.CANCELED
    || order.fulfillment.status === FulfillmentAggregateStatuses.CANCELED;

  // A dead order has no delivery ahead, so it never advertises an estimate.
  if (done || canceled) return undefined;

  const estimate = order.shipping?.estimate?.latest_delivery_date ??
    order.fulfillment.legacy_shipping.estimated_delivery;

  return formatProgressEstimate(estimate);
}

/**
 * The Payout milestone Finance reports for this Order. It only exists when the
 * Order has a payout fact at all, and it only claims completion when Finance
 * actually paid, or a refund means no money is owed.
 */
function payoutMilestone(
  orderPayout: ShopOrderPayout | null | undefined,
  refunded: boolean,
): Milestone | undefined {
  if (!orderPayout) return undefined;

  const payout = orderPayout.payout;

  if (payout?.state === 'paid') {
    return {
      key: 'payout',
      title: 'Payout',
      icon: 'revenue',
      date: payout.paid_at ? `Paid ${dayjs(payout.paid_at).format('D MMM')}` : undefined,
      done: true,
    };
  }

  if (refunded) {
    return {
      key: 'payout',
      title: 'Payout',
      icon: 'revenue',
      description: 'Refunded',
      blocked: true,
      done: false,
    };
  }

  // Without a paid journal basis there is nothing to release, so Finance has
  // no payout state to show.
  if (orderPayout.seller_payable_minor === null) return undefined;

  if (payout) {
    return {
      key: 'payout',
      title: 'Payout',
      icon: 'revenue',
      description: 'Processing',
      done: false,
    };
  }

  // Where the money will go matters before when: an unusable account cannot
  // receive the payout no matter what the schedule says.
  const accountDescription = payoutAccountDescription(
    orderPayout.payout_method.account_status,
  );
  if (accountDescription) {
    return {
      key: 'payout',
      title: 'Payout',
      icon: 'revenue',
      description: accountDescription,
      done: false,
    };
  }

  return {
    key: 'payout',
    title: 'Payout',
    icon: 'revenue',
    description: payoutScheduleDescription(orderPayout),
    // Availability is Finance's recorded fact; until then the seller is simply
    // waiting for delivery, so the step cannot become active.
    blocked: !orderPayout.availability.recorded,
    done: false,
  };
}

/** Why a Payout Account still blocks the money, or undefined when it is usable. */
function payoutAccountDescription(
  status: ShopOrderPayout['payout_method']['account_status'],
): string | undefined {
  switch (status) {
    case 'missing':
      return 'Add bank account';
    case 'onboarding':
    case 'action_required':
      return 'Verifying account';
    case 'restricted':
    case 'disabled':
      return 'On hold';
    case 'active':
      return undefined;
  }
}

/**
 * When Finance would release a payout whose account is usable. Dates come only
 * from Finance's schedule: a missing `next_payout_date` never becomes a made-up
 * estimate.
 */
function payoutScheduleDescription(orderPayout: ShopOrderPayout): string {
  if (!orderPayout.availability.recorded) return 'After delivery';

  const method = orderPayout.payout_method;
  let description = 'Added to balance';
  if (method.auto_payout_enabled) {
    const nextPayoutDate = method.next_payout_date;
    if (nextPayoutDate) {
      // The run date is a UTC calendar day, so compare in UTC and format it as
      // the same day rather than letting the browser timezone shift it.
      description = nextPayoutDate === new Date().toISOString().slice(0, 10)
        ? 'Releases today'
        : `Est. ${dayjs.utc(nextPayoutDate).format('D MMM')}`;
    }
    else {
      description = 'Available';
    }
  }

  return description;
}
