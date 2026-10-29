import dayjs from 'dayjs';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { TimelineItem, TimelineItemState } from '@arc/ui/patterns/timeline.vue';
import type {
  AdminOrderDetailOrder,
  AdminOrderFinancialBreakdown,
} from '~/domains/orders/api/contracts/admin-orders.contract';
import { formatOrderStatusLabel } from '~/domains/orders/utils/order-presentation';

/**
 * The progress strip is dense and horizontal, so its timestamps are compact:
 * `27 Oct 7:41`. The vertical order timeline keeps the long formatter.
 */
function formatProgressDate(value?: string): string | undefined {
  return value ? dayjs(value).format('D MMM h:mm') : undefined;
}

/**
 * The accepted delivery estimate is a day, not a moment: `Est. 31 Oct`. An
 * unparseable value renders nothing rather than an invented date.
 */
function formatEstimateLabel(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const estimate = dayjs(value);

  return estimate.isValid() ? `Est. ${estimate.format('D MMM')}` : undefined;
}

/** A settled payout is dated per day: `Paid 3 Nov`. */
function formatPaidLabel(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const paidAt = dayjs(value);

  return paidAt.isValid() ? `Paid ${paidAt.format('D MMM')}` : undefined;
}

/**
 * A scheduled automatic run is a day the seller may act on, so it is dated:
 * `Releases today` when the run is today (UTC), otherwise `Est. D MMM`. An
 * unusable date never becomes an invented label.
 */
function formatScheduleLabel(nextPayoutDate: string, today: Date): string | undefined {
  const runDate = dayjs(nextPayoutDate);

  if (!runDate.isValid()) {
    return undefined;
  }

  return runDate.format('YYYY-MM-DD') === today.toISOString().slice(0, 10)
    ? 'Releases today'
    : `Est. ${runDate.format('D MMM')}`;
}

/** Payment has cleared; a refund/archive keeps the payment milestone settled. */
const SETTLED_PAYMENT_STATUSES: Record<string, true> = {
  paid: true,
  completed: true,
  refunded: true,
  archived: true,
};
const FAILED_PAYMENT_STATUSES: Record<string, true> = { canceled: true, expired: true };
/** Orders that will never advance again, whether or not payment cleared. */
const TERMINAL_STATUSES: Record<string, true> = {
  canceled: true,
  expired: true,
  refunded: true,
  archived: true,
};
const OPERATIONAL_STEP_KEYS: Record<string, true> = {
  prepared: true,
  dispatched: true,
  in_transit: true,
  delivered: true,
};

function hasTransitEvidence(order: AdminOrderDetailOrder): boolean {
  return order.fulfillment.groups.some(group =>
    group.shipments.some(shipment =>
      shipment.status !== 'voided'
      && (shipment.status === 'in_transit'
        || shipment.updates.some(update => update.status === 'in_transit')),
    ),
  );
}

function legacyPrepared(order: AdminOrderDetailOrder): boolean {
  const shipping = order.fulfillment.legacy_shipping;

  return Boolean(shipping.shipped_at || shipping.delivered_at)
    || ['in_transit', 'shipped', 'delivered'].includes(shipping.status);
}

function legacyDispatched(order: AdminOrderDetailOrder): boolean {
  const shipping = order.fulfillment.legacy_shipping;

  return Boolean(shipping.shipped_at)
    || ['in_transit', 'shipped', 'delivered'].includes(shipping.status);
}

function legacyDelivered(order: AdminOrderDetailOrder): boolean {
  const shipping = order.fulfillment.legacy_shipping;

  return Boolean(shipping.delivered_at) || shipping.status === 'delivered';
}

/**
 * Finance owns the payout facts; this only composes them into a milestone.
 * A canceled order never pays out, so it contributes no step at all.
 *
 * Precedence follows the money: a paid payout is a fact, a refunded order pays
 * nothing back out, a claimed payout is in flight, and only then do the
 * destination and schedule decide what unblocks the money.
 */
function payoutStep(
  order: AdminOrderDetailOrder,
  breakdown: AdminOrderFinancialBreakdown | undefined,
  today: Date,
): TimelineItem | undefined {
  if (!breakdown || typeof breakdown.seller_payable_minor !== 'number') {
    return undefined;
  }

  if (order.status === 'canceled' || order.canceled_at) {
    return undefined;
  }

  /** A dead order has no money ahead of it, so nothing on it is active. */
  const reachedState: TimelineItemState = TERMINAL_STATUSES[order.status] === true
    ? 'pending'
    : 'active';
  const { availability, payout, payout_method: method } = breakdown;
  const base = { key: 'payout', title: 'Payout', icon: 'revenue' };

  if (payout?.state === 'paid') {
    return {
      ...base,
      state: 'completed',
      date: formatPaidLabel(payout.paid_at ?? undefined),
    };
  }

  if (order.status === 'refunded' || order.refunded_at) {
    return { ...base, state: 'pending', description: 'Refunded' };
  }

  if (payout) {
    return { ...base, state: reachedState, description: 'Processing' };
  }

  if (method?.account_status === 'missing') {
    return { ...base, state: reachedState, description: 'Add bank account' };
  }

  if (method?.account_status === 'onboarding' || method?.account_status === 'action_required') {
    return { ...base, state: reachedState, description: 'Verifying account' };
  }

  if (method?.account_status === 'restricted' || method?.account_status === 'disabled') {
    return { ...base, state: reachedState, description: 'On hold' };
  }

  /** Availability is Finance's recorded fact, so no estimate dates it early. */
  if (!availability.recorded) {
    return { ...base, state: 'pending', description: 'After delivery' };
  }

  const scheduled = method?.auto_payout_enabled && method.next_payout_date
    ? formatScheduleLabel(method.next_payout_date, today)
    : undefined;

  return {
    ...base,
    state: reachedState,
    description: scheduled ?? (method?.auto_payout_enabled ? 'Processing' : 'Added to balance'),
  };
}

/**
 * The admin detail payload exposes the quantity-based fulfillment projection and
 * the recorded shipment journey, not a synthetic event stream. Each milestone
 * therefore only advances on evidence the payload actually carries, and partial
 * progress is stated with the real counts.
 *
 * The ladder is single-track: completed milestones form a prefix, at most one
 * milestone is active while the order is in flight, and everything after it is
 * pending. Terminal outcomes are appended after the ladder.
 */
export function useAdminOrderProgress(
  order: MaybeRefOrGetter<AdminOrderDetailOrder | undefined>,
  breakdown?: MaybeRefOrGetter<AdminOrderFinancialBreakdown | undefined>,
  /** The clock the schedule labels compare against; tests pin it. */
  now?: MaybeRefOrGetter<Date | undefined>,
) {
  const resolvedOrder = computed(() => toValue(order));
  const resolvedBreakdown = computed(() => (breakdown ? toValue(breakdown) : undefined));
  const resolvedNow = computed(() => (now ? toValue(now) : undefined) ?? new Date());

  return computed<TimelineItem[]>(() => {
    const value = resolvedOrder.value;

    if (!value) {
      return [];
    }

    const { fulfillment } = value;
    const progress = fulfillment.progress;
    const isLegacy = fulfillment.groups.length === 0;

    /**
     * Canceled units cannot be prepared, dispatched or delivered, so every
     * fulfillment denominator excludes them.
     */
    const deliverable = Math.max(progress.ordered - progress.canceled, 0);

    /**
     * Progress dates come from the recorded shipment journey, never from a
     * synthesized timeline. `sort()` on ISO timestamps keeps earliest/latest
     * lookups simple.
     */
    const activeShipments = fulfillment.groups.flatMap(group =>
      group.shipments.filter(shipment => shipment.status !== 'voided'),
    );
    const preparedAt = activeShipments.map(shipment => shipment.prepared_at).sort()[0];
    const dispatchedAt = activeShipments
      .map(shipment => shipment.dispatched_at)
      .filter((date): date is string => Boolean(date))
      .sort()[0];
    const transitAt = activeShipments
      .flatMap(shipment => shipment.updates
        .filter(update => update.status === 'in_transit')
        .map(update => update.occurred_at))
      .sort()
      .at(-1);
    const deliveredAt = activeShipments
      .map(shipment => shipment.delivered_at)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1);

    const preparedEvidence = isLegacy
      ? legacyPrepared(value)
      : progress.prepared > 0 || progress.dispatched > 0 || progress.delivered > 0;
    const dispatchedEvidence = isLegacy ? legacyDispatched(value) : progress.dispatched > 0;
    const transitEvidence = !isLegacy && hasTransitEvidence(value);
    const deliveredEvidence = isLegacy
      ? legacyDelivered(value)
      : deliverable > 0 && progress.delivered >= deliverable;

    const paymentSettled = SETTLED_PAYMENT_STATUSES[value.status] === true;
    const paymentFailed = FAILED_PAYMENT_STATUSES[value.status] === true;
    /** An order only advances through fulfillment once payment has cleared. */
    const canAdvance = paymentSettled && TERMINAL_STATUSES[value.status] !== true;
    /** Delivery evidence (quantity or legacy timestamp) completes transit. */
    const transitDone = transitEvidence || (!isLegacy && progress.delivered > 0);

    const paymentState: TimelineItemState = paymentSettled || (paymentFailed && preparedEvidence)
      ? 'completed'
      : paymentFailed ? 'failed' : 'active';

    const preparedState: TimelineItemState = preparedEvidence
      ? 'completed'
      : canAdvance && deliverable > 0 ? 'active' : 'pending';

    const dispatchedState: TimelineItemState = dispatchedEvidence || (!isLegacy && progress.delivered > 0)
      ? 'completed'
      : canAdvance && preparedEvidence ? 'active' : 'pending';

    const deliveredState: TimelineItemState = deliveredEvidence
      ? 'completed'
      : canAdvance && (isLegacy ? dispatchedEvidence : transitDone) ? 'active' : 'pending';

    const steps: TimelineItem[] = [
      {
        key: 'created',
        title: 'Order created',
        state: 'completed',
        icon: 'orders',
        date: formatProgressDate(value.created_at),
      },
      {
        key: 'paid',
        title: 'Payment / order status',
        state: paymentState,
        icon: 'payment',
        date: formatOrderStatusLabel(value.status),
      },
      {
        key: 'prepared',
        title: 'Prepared',
        state: preparedState,
        icon: 'product',
        date: isLegacy ? undefined : formatProgressDate(preparedAt),
      },
      {
        key: 'dispatched',
        title: 'Dispatched',
        state: dispatchedState,
        icon: 'shipping',
        date: isLegacy ? undefined : formatProgressDate(dispatchedAt),
      },
    ];

    if (!isLegacy) {
      steps.push({
        key: 'in_transit',
        title: 'In transit',
        state: transitDone
          ? 'completed'
          : canAdvance && dispatchedEvidence ? 'active' : 'pending',
        icon: 'transit',
        date: formatProgressDate(transitAt),
      });
    }

    /**
     * The accepted delivery estimate is a day the buyer was promised, so it
     * only dates an unreached Delivered step. The buyer-accepted quote wins,
     * with the legacy shipping record as fallback; an actual delivery timestamp
     * always overrides it.
     */
    const acceptedEstimate = value.shipping?.estimate?.latest_delivery_date ??
      value.fulfillment.legacy_shipping.estimated_delivery;
    const actualDeliveredAt = isLegacy ? undefined : formatProgressDate(deliveredAt);
    const canceled = value.status === 'canceled' || Boolean(value.canceled_at);
    const deliveredDate = deliveredState === 'completed'
      ? actualDeliveredAt
      : actualDeliveredAt ?? (canceled ? undefined : formatEstimateLabel(acceptedEstimate));

    steps.push({
      key: 'delivered',
      title: 'Delivered',
      state: deliveredState,
      icon: 'delivered',
      date: deliveredDate,
    });

    const payout = payoutStep(value, resolvedBreakdown.value, resolvedNow.value);

    if (payout) {
      steps.push(payout);
    }

    if (fulfillment.requires_reconciliation) {
      const furthest = [...steps]
        .reverse()
        .find(step =>
          OPERATIONAL_STEP_KEYS[step.key ?? ''] === true
          && (step.state === 'completed' || step.state === 'active'),
        );

      if (furthest) {
        furthest.description = furthest.description
          ? `${furthest.description} · Fulfillment needs reconciliation`
          : 'Fulfillment needs reconciliation';
      }
    }

    if (value.canceled_at) {
      steps.push({
        key: 'canceled',
        title: 'Canceled',
        state: 'failed',
        icon: 'close',
        date: formatProgressDate(value.canceled_at),
      });
    }

    if (value.refunded_at) {
      steps.push({
        key: 'refunded',
        title: 'Refunded',
        state: 'completed',
        icon: 'refund',
        date: formatProgressDate(value.refunded_at),
      });
    }

    return steps;
  });
}
