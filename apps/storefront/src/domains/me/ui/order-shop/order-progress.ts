import dayjs from 'dayjs';
import { OrderStatuses } from '@arc/enums/order';
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import type { TimelineItem, TimelineItemState } from '@arc/ui/patterns/timeline.vue';
import type {
  GetOrderShopsResponse,
  LegacyOrderShipping,
} from '~/domains/me/api/order/contracts/order.contract';

type OrderShop = GetOrderShopsResponse['order_shops'][number];
type FulfillmentProgress = OrderShop['fulfillment']['progress'];

const CONFIRMED_STATUSES: Record<OrderStatuses, true | undefined> = {
  [OrderStatuses.PAID]: true,
  [OrderStatuses.COMPLETED]: true,
  [OrderStatuses.REFUNDED]: true,
  [OrderStatuses.ARCHIVED]: true,
  [OrderStatuses.CANCELED]: undefined,
  [OrderStatuses.PENDING]: undefined,
  [OrderStatuses.CHECKOUT_PENDING]: undefined,
  [OrderStatuses.AWAITING_PAYMENT]: undefined,
  [OrderStatuses.EXPIRED]: undefined,
};

const FAILED_STATUSES: Record<OrderStatuses, true | undefined> = {
  [OrderStatuses.CANCELED]: true,
  [OrderStatuses.EXPIRED]: true,
  [OrderStatuses.PAID]: undefined,
  [OrderStatuses.COMPLETED]: undefined,
  [OrderStatuses.REFUNDED]: undefined,
  [OrderStatuses.ARCHIVED]: undefined,
  [OrderStatuses.PENDING]: undefined,
  [OrderStatuses.CHECKOUT_PENDING]: undefined,
  [OrderStatuses.AWAITING_PAYMENT]: undefined,
};

/**
 * Aggregate states that prove at least one unit left the prep stage. The
 * legacy `dispatched`/`in_transit` projections carry the same meaning.
 */
const PREPARED_AGGREGATE_STATUSES: Record<FulfillmentAggregateStatuses, true | undefined> = {
  [FulfillmentAggregateStatuses.PREPARED]: true,
  [FulfillmentAggregateStatuses.PARTIALLY_SHIPPED]: true,
  [FulfillmentAggregateStatuses.SHIPPED]: true,
  [FulfillmentAggregateStatuses.PARTIALLY_DELIVERED]: true,
  [FulfillmentAggregateStatuses.DELIVERED]: true,
  [FulfillmentAggregateStatuses.DISPATCHED]: true,
  [FulfillmentAggregateStatuses.IN_TRANSIT]: true,
  [FulfillmentAggregateStatuses.UNFULFILLED]: undefined,
  [FulfillmentAggregateStatuses.CANCELED]: undefined,
};

const LEGACY_SHIPPED_STATUSES: Record<string, true | undefined> = {
  dispatched: true,
  shipped: true,
  in_transit: true,
  delivered: true,
};

type Milestone = {
  key: string
  title: string
  icon: string
  date?: string
  /** Marks `date` as an accepted estimate rather than a recorded event. */
  estimate?: boolean
  description?: string
  completed: boolean
};

/** Progress labels stay compact: day, abbreviated month, 12-hour time, no zone. */
const PROGRESS_TIMESTAMP_FORMAT = 'D MMM h:mm';

/** An estimate is a day, not an instant, and is prefixed so it cannot pass for a recorded date. */
const PROGRESS_ESTIMATE_FORMAT = 'D MMM';
const PROGRESS_ESTIMATE_PREFIX = 'Est. ';

function formatTimestamp(value: string | Date | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format(PROGRESS_TIMESTAMP_FORMAT) : undefined;
}

function formatEstimate(value: string | Date | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? `${PROGRESS_ESTIMATE_PREFIX}${parsed.format(PROGRESS_ESTIMATE_FORMAT)}` : undefined;
}

/** Formats the earliest or latest valid payload timestamp in a set of events. */
function pickTimestamp(
  values: Array<string | Date | undefined | null>,
  edge: 'earliest' | 'latest',
): string | undefined {
  const times = values
    .flatMap(value => value ? [dayjs(value)] : [])
    .filter(value => value.isValid())
    .sort((left, right) => left.valueOf() - right.valueOf());

  const picked = edge === 'latest' ? times.at(-1) : times[0];

  return picked ? picked.format(PROGRESS_TIMESTAMP_FORMAT) : undefined;
}

function legacyShipped(legacy: LegacyOrderShipping): boolean {
  return Boolean(legacy.shipped_at || legacy.delivered_at)
    || LEGACY_SHIPPED_STATUSES[legacy.status.toLowerCase()] === true;
}

function quantityHint(
  count: number,
  total: number,
  verb: string,
): string | undefined {
  if (count <= 0 || total <= 0 || count >= total) {
    return undefined;
  }

  return `${count} of ${total} items ${verb}`;
}

/**
 * Buyer-facing milestones for one shop's order. Every state is derived from the
 * payload's commercial status and quantity-based fulfillment projection; no
 * carrier event or date is inferred when the payload lacks it. The one forward
 * looking label is the Delivered estimate the buyer accepted, shown until that
 * milestone is reached.
 *
 * The milestones form a single ladder: completed steps are always a prefix,
 * then at most one active step, then pending steps. Failed milestones only
 * replace the confirmation step or are appended last, so a late "active" can
 * never appear behind a completed later milestone.
 */
export function buildOrderProgressSteps(orderShop: OrderShop): TimelineItem[] {
  const fulfillment = orderShop.fulfillment;
  const progress: FulfillmentProgress = fulfillment.progress;
  const status = orderShop.status;
  const isLegacy = fulfillment.groups.length === 0;
  const legacy = fulfillment.legacy_shipping;
  const deliverable = Math.max(progress.ordered - progress.canceled, 0);
  const canceled = progress.canceled > 0;
  const cancelReason = orderShop.cancel_reason?.trim() || undefined;

  const activeShipments = isLegacy
    ? []
    : fulfillment.groups.flatMap(group =>
      group.shipments.filter(shipment => shipment.status !== ShipmentStatuses.VOIDED),
    );
  const transitEventRecorded = activeShipments.some(shipment =>
    shipment.status === ShipmentStatuses.IN_TRANSIT
    || shipment.updates.some(update => update.status === ShipmentStatuses.IN_TRANSIT),
  );

  const legacyStatus = isLegacy ? legacy.status.toLowerCase() : undefined;
  const legacyDelivered = Boolean(legacy.delivered_at)
    || legacyStatus === ShipmentStatuses.DELIVERED;

  // Only timestamps the payload already records are surfaced; a milestone that
  // was reached without a recorded time simply carries no date.
  const preparationDate = isLegacy
    ? undefined
    : pickTimestamp(activeShipments.map(shipment => shipment.prepared_at), 'latest');
  const dispatchDate = isLegacy
    ? formatTimestamp(legacy.shipped_at)
    : pickTimestamp(
      activeShipments.flatMap(shipment => [
        shipment.dispatched_at,
        ...shipment.updates
          .filter(update => update.status === ShipmentStatuses.DISPATCHED)
          .map(update => update.occurred_at),
      ]),
      'earliest',
    );
  const transitDate = isLegacy
    ? undefined
    : pickTimestamp(
      activeShipments.flatMap(shipment => shipment.updates
        .filter(update => update.status === ShipmentStatuses.IN_TRANSIT)
        .map(update => update.occurred_at)),
      'earliest',
    );
  const deliveryDate = isLegacy
    ? formatTimestamp(legacy.delivered_at)
    : pickTimestamp(
      activeShipments.flatMap(shipment => [
        shipment.delivered_at,
        ...shipment.updates
          .filter(update => update.status === ShipmentStatuses.DELIVERED)
          .map(update => update.occurred_at),
      ]),
      'latest',
    );

  // Quantities are stage-exclusive: `dispatched` already includes in-transit and
  // delivered units, while `prepared` only counts units still waiting to ship.
  // Delivery therefore implies dispatch, and dispatch implies preparation.
  const deliveredEvidence = isLegacy ? legacyDelivered : progress.delivered > 0;
  const deliveredCompleted = isLegacy
    ? legacyDelivered
    : deliverable > 0 && progress.delivered >= deliverable;

  const shippedEvidence = isLegacy
    ? legacyShipped(legacy)
    : progress.dispatched > 0 || deliveredEvidence;

  const preparedEvidence = isLegacy
    ? shippedEvidence
    : progress.prepared > 0
      || shippedEvidence
      || PREPARED_AGGREGATE_STATUSES[fulfillment.status] === true;

  // A shipment can only reach delivery through dispatch, so transit completed
  // whenever any unit is delivered even if no transit event was recorded.
  const transitCompleted = deliveredEvidence
    || transitEventRecorded
    || legacyStatus === ShipmentStatuses.IN_TRANSIT;
  const showTransit = isLegacy
    ? legacyStatus === ShipmentStatuses.IN_TRANSIT || legacyDelivered
    : activeShipments.length > 0;

  const confirmedFailed = FAILED_STATUSES[status] === true;
  const confirmedCompleted = CONFIRMED_STATUSES[status] === true || preparedEvidence;
  const expired = status === OrderStatuses.EXPIRED;

  // Buyers get the recorded reason only for a canceled order; an expired
  // checkout has no operator-supplied reason, so state just the fact.
  const confirmedDescription = confirmedFailed
    ? expired
      ? 'Checkout session expired before payment completed.'
      : cancelReason
    : status === OrderStatuses.AWAITING_PAYMENT
      ? 'Awaiting payment'
      : undefined;

  // The buyer only ever sees the estimate they accepted at checkout, and only
  // while delivery is still ahead: a reached milestone carries its recorded
  // time, and a failed order has no delivery left to wait for.
  const deliveryEstimate = deliveredCompleted || confirmedFailed
    ? undefined
    : formatEstimate(
      orderShop.shipping?.estimate?.latest_delivery_date ?? legacy.estimated_delivery,
    );

  const milestones: Milestone[] = [
    {
      key: 'confirmed',
      title: confirmedFailed
        ? expired ? 'Order expired' : 'Order canceled'
        : 'Order confirmed',
      icon: confirmedFailed ? 'close' : 'orders',
      date: formatTimestamp(orderShop.created_at),
      description: confirmedDescription,
      completed: !confirmedFailed && confirmedCompleted,
    },
    {
      key: 'preparing',
      title: 'Preparing',
      icon: 'product',
      date: preparationDate,
      description: isLegacy ? undefined : quantityHint(progress.prepared, deliverable, 'prepared'),
      completed: preparedEvidence,
    },
    {
      key: 'shipped',
      title: 'Shipped',
      icon: 'shipping',
      date: dispatchDate,
      description: isLegacy ? undefined : quantityHint(progress.dispatched, deliverable, 'shipped'),
      completed: shippedEvidence,
    },
  ];

  if (showTransit) {
    milestones.push({
      key: 'in_transit',
      title: 'In transit',
      icon: 'transit',
      date: transitDate,
      completed: transitCompleted,
    });
  }

  milestones.push({
    key: 'delivered',
    title: 'Delivered',
    icon: 'delivered',
    date: deliveredCompleted ? deliveryDate : deliveryEstimate,
    estimate: Boolean(deliveryEstimate),
    description: isLegacy ? undefined : quantityHint(progress.delivered, deliverable, 'delivered'),
    completed: deliveredCompleted,
  });

  let activeAssigned = false;
  const items: TimelineItem[] = milestones.map((milestone) => {
    let state: TimelineItemState;
    if (confirmedFailed) {
      state = milestone.key === 'confirmed' ? 'failed' : 'pending';
    }
    else if (milestone.completed) {
      state = 'completed';
    }
    else if (!activeAssigned) {
      state = 'active';
      activeAssigned = true;
    }
    else {
      state = 'pending';
    }

    return {
      key: milestone.key,
      title: milestone.title,
      icon: milestone.icon,
      // Recorded dates appear once a milestone is reached; the accepted
      // delivery estimate is the only date shown ahead of reaching it.
      date: milestone.key === 'confirmed' || state === 'completed' || milestone.estimate
        ? milestone.date
        : undefined,
      description: milestone.description,
      state,
    };
  });

  if (canceled) {
    items.push({
      key: 'canceled',
      title: 'Canceled',
      icon: 'close',
      date: formatTimestamp(orderShop.canceled_at),
      description: quantityHint(progress.canceled, progress.ordered, 'canceled'),
      state: 'failed',
    });
  }

  return items;
}
