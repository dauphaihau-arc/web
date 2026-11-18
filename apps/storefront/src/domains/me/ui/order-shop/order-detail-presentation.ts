import dayjs from 'dayjs';
import { carrierEventLabel, formatShippingEstimateRange } from '@arc/utils';
import { OrderStatuses } from '@arc/enums/order';
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import type { ElementType } from '@arc/contracts/utils';
import type {
  FulfillmentShipment,
  FulfillmentShipmentItem,
  GetOrderShopsResponse,
  LegacyOrderShipping,
  Payment,
} from '~/domains/me/api/order/contracts/order.contract';
import {
  translateAccount,
  type AccountTranslator,
} from '~/domains/me/ui/account-i18n';

type OrderShop = ElementType<GetOrderShopsResponse['order_shops']>;
type OrderShopProduct = OrderShop['products'][number];

export type BadgeTone = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

const ORDER_STATUS_TONE: Record<OrderStatuses, BadgeTone> = {
  [OrderStatuses.PAID]: 'green',
  [OrderStatuses.COMPLETED]: 'green',
  [OrderStatuses.ARCHIVED]: 'gray',
  [OrderStatuses.PENDING]: 'yellow',
  [OrderStatuses.CHECKOUT_PENDING]: 'yellow',
  [OrderStatuses.AWAITING_PAYMENT]: 'yellow',
  [OrderStatuses.CANCELED]: 'red',
  [OrderStatuses.EXPIRED]: 'red',
  [OrderStatuses.REFUNDED]: 'blue',
};

const FULFILLMENT_STATUS_TONE: Record<FulfillmentAggregateStatuses, BadgeTone> = {
  [FulfillmentAggregateStatuses.UNFULFILLED]: 'yellow',
  [FulfillmentAggregateStatuses.PREPARED]: 'yellow',
  [FulfillmentAggregateStatuses.PARTIALLY_SHIPPED]: 'yellow',
  [FulfillmentAggregateStatuses.SHIPPED]: 'blue',
  [FulfillmentAggregateStatuses.DISPATCHED]: 'blue',
  [FulfillmentAggregateStatuses.IN_TRANSIT]: 'blue',
  [FulfillmentAggregateStatuses.PARTIALLY_DELIVERED]: 'yellow',
  [FulfillmentAggregateStatuses.DELIVERED]: 'green',
  [FulfillmentAggregateStatuses.CANCELED]: 'red',
};

const FULFILLMENT_STATUS_LABEL_KEY: Record<FulfillmentAggregateStatuses, string> = {
  [FulfillmentAggregateStatuses.UNFULFILLED]: 'account.orders.fulfillment.preparingOrder',
  [FulfillmentAggregateStatuses.PREPARED]: 'account.orders.fulfillment.preparingOrder',
  [FulfillmentAggregateStatuses.PARTIALLY_SHIPPED]: 'account.orders.fulfillment.partiallyShipped',
  [FulfillmentAggregateStatuses.SHIPPED]: 'account.orders.fulfillment.shipped',
  [FulfillmentAggregateStatuses.DISPATCHED]: 'account.orders.fulfillment.shipped',
  [FulfillmentAggregateStatuses.IN_TRANSIT]: 'account.orders.fulfillment.shipped',
  [FulfillmentAggregateStatuses.PARTIALLY_DELIVERED]: 'account.orders.fulfillment.partiallyDelivered',
  [FulfillmentAggregateStatuses.DELIVERED]: 'account.orders.fulfillment.delivered',
  [FulfillmentAggregateStatuses.CANCELED]: 'account.orders.fulfillment.canceled',
};

const ORDER_STATUS_LABEL_KEY: Record<OrderStatuses, string> = {
  [OrderStatuses.CANCELED]: 'account.orders.statuses.canceled',
  [OrderStatuses.PENDING]: 'account.orders.statuses.pending',
  [OrderStatuses.CHECKOUT_PENDING]: 'account.orders.statuses.checkoutPending',
  [OrderStatuses.AWAITING_PAYMENT]: 'account.orders.statuses.awaitingPayment',
  [OrderStatuses.EXPIRED]: 'account.orders.statuses.expired',
  [OrderStatuses.PAID]: 'account.orders.statuses.paid',
  [OrderStatuses.REFUNDED]: 'account.orders.statuses.refunded',
  [OrderStatuses.COMPLETED]: 'account.orders.statuses.completed',
  [OrderStatuses.ARCHIVED]: 'account.orders.statuses.archived',
};

export function orderStatusTone(status: OrderStatuses): BadgeTone {
  return ORDER_STATUS_TONE[status];
}

export function orderStatusLabel(
  status: OrderStatuses,
  t: AccountTranslator = translateAccount,
): string {
  return t(ORDER_STATUS_LABEL_KEY[status]);
}

export function fulfillmentStatusTone(status: FulfillmentAggregateStatuses): BadgeTone {
  return FULFILLMENT_STATUS_TONE[status];
}

export function fulfillmentStatusLabel(
  status: FulfillmentAggregateStatuses,
  t: AccountTranslator = translateAccount,
): string {
  return t(FULFILLMENT_STATUS_LABEL_KEY[status]);
}

export type OrderPackageState = 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'canceled';

export type OrderPackageLine = {
  /** Stable per package: the same order item can be split across packages. */
  id: string
  orderItemId: string
  title: string
  imageUrl?: string
  variantLabels: string[]
  quantity: number
  unitPriceMinor: number
  amountMinor: number
  currency: string
};

export type OrderPackageStage = {
  key: 'placed' | 'packed' | 'shipped' | 'delivered'
  label: string
  /** Date/estimate fragment, empty when unknown. */
  detail: string
  complete: boolean
};

export type OrderPackageUpdate = {
  id: string

  /** Human line: the carrier event when present, else the update note or status label. */
  title: string

  /** Carrier scan location, when the update carries one. */
  location?: string

  /** `MMM DD, HH:mm` */
  occurredAt: string
};

export type OrderPackage = {
  id: string
  index: number
  total: number
  state: OrderPackageState
  statusLabel: string

  /** Date fragment only, e.g. `Oct 27`. */
  statusDetail: string

  /** Order-level estimate, e.g. `Est. Nov 2 - 6`. */
  estimateDetail: string

  /** Order-level processing deadline, e.g. `Ships by Oct 31`. */
  shipByDetail: string

  carrier?: string

  /** Server-resolved display name, falling back to the code. */
  carrierName?: string

  trackingNumber?: string

  /** True when the carrier cannot expose tracking updates for this number. */
  trackingUnverified?: boolean

  note?: string
  lines: OrderPackageLine[]

  /** Empty for a canceled package. */
  stages: OrderPackageStage[]

  /** Newest first; empty for legacy packages. */
  updates: OrderPackageUpdate[]
};

export type OrderPackagesSummary = {
  packages: OrderPackage[]
  counts: {
    total: number
    delivered: number
    inTransit: number
    preparing: number
    canceled: number
  }
};

const PACKAGE_STATE_META: Record<OrderPackageState, { key: string, tone: BadgeTone }> = {
  preparing: { key: 'account.orders.statuses.preparing', tone: 'yellow' },
  shipped: { key: 'account.orders.statuses.shipped', tone: 'blue' },
  in_transit: { key: 'account.orders.statuses.inTransit', tone: 'blue' },
  delivered: { key: 'account.orders.statuses.delivered', tone: 'green' },
  canceled: { key: 'account.orders.statuses.canceled', tone: 'red' },
};

export function orderPackageTone(pkg: OrderPackage): BadgeTone {
  return PACKAGE_STATE_META[pkg.state].tone;
}

/** `Delivered Oct 27` / `In transit` / `Preparing`. */
export function orderPackageStatusText(pkg: OrderPackage): string {
  return pkg.state === 'delivered' && pkg.statusDetail
    ? `${pkg.statusLabel} ${pkg.statusDetail}`
    : pkg.statusLabel;
}

function formatShortDate(value: string | Date | undefined | null): string {
  if (!value) {
    return '';
  }
  return dayjs(value).isValid() ? dayjs(value).format('MMM DD') : '';
}

function formatShortDateTime(value: string | Date | undefined | null): string {
  if (!value) {
    return '';
  }
  return dayjs(value).isValid() ? dayjs(value).format('MMM DD, HH:mm') : '';
}

const LEGACY_STATE_BY_STATUS: Record<string, OrderPackageState> = {
  pre_transit: 'preparing',
  shipped: 'in_transit',
  in_transit: 'in_transit',
  delivered: 'delivered',
};

const STAGE_LABEL_KEY = {
  placed: 'account.orders.progress.orderPlaced',
  packed: 'account.orders.progress.packed',
  shipped: 'account.orders.progress.shipped',
  delivered: 'account.orders.progress.delivered',
} as const;

const SHIPMENT_UPDATE_LABEL_KEY: Record<ShipmentStatuses, string> = {
  [ShipmentStatuses.PREPARED]: 'account.orders.fulfillment.prepared',
  [ShipmentStatuses.DISPATCHED]: 'account.orders.fulfillment.shipped',
  [ShipmentStatuses.IN_TRANSIT]: 'account.orders.fulfillment.inTransit',
  [ShipmentStatuses.DELIVERED]: 'account.orders.fulfillment.delivered',
  [ShipmentStatuses.VOIDED]: 'account.orders.fulfillment.voided',
};

const CARRIER_EVENT_LABEL_KEY: Record<string, string> = {
  LABEL_CREATED: 'account.orders.carrierEvents.labelCreated',
  PICKED_UP: 'account.orders.carrierEvents.pickedUp',
  IN_TRANSIT: 'account.orders.carrierEvents.inTransit',
  OUT_FOR_DELIVERY: 'account.orders.carrierEvents.outForDelivery',
  DELIVERED: 'account.orders.carrierEvents.delivered',
  DELIVERY_FAILED: 'account.orders.carrierEvents.deliveryFailed',
  RETURNED: 'account.orders.carrierEvents.returned',
};

function carrierEventTitle(
  eventCode: string | null | undefined,
  t: AccountTranslator,
): string | undefined {
  const code = eventCode?.trim().toUpperCase();
  const key = code ? CARRIER_EVENT_LABEL_KEY[code] : undefined;

  return key ? t(key) : carrierEventLabel(eventCode);
}

function shipmentUpdateTitle(
  update: FulfillmentShipment['updates'][number],
  t: AccountTranslator,
): string {
  const statusKey = SHIPMENT_UPDATE_LABEL_KEY[update.status];

  return carrierEventTitle(update.event_code, t)
    || update.note?.trim()
    || (statusKey ? t(statusKey) : '')
    || '';
}

const PACKED_STATUSES = new Set<FulfillmentAggregateStatuses>([
  FulfillmentAggregateStatuses.PREPARED,
  FulfillmentAggregateStatuses.PARTIALLY_SHIPPED,
  FulfillmentAggregateStatuses.SHIPPED,
  FulfillmentAggregateStatuses.DISPATCHED,
  FulfillmentAggregateStatuses.IN_TRANSIT,
  FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
  FulfillmentAggregateStatuses.DELIVERED,
]);

const SHIPPED_STATUSES = new Set<FulfillmentAggregateStatuses>([
  FulfillmentAggregateStatuses.PARTIALLY_SHIPPED,
  FulfillmentAggregateStatuses.SHIPPED,
  FulfillmentAggregateStatuses.DISPATCHED,
  FulfillmentAggregateStatuses.IN_TRANSIT,
  FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
  FulfillmentAggregateStatuses.DELIVERED,
]);

/** `Ships by Oct 31` from the order-level processing window, or `''`. */
function buildShipByDetail(orderShop: OrderShop, t: AccountTranslator): string {
  const maxDays = orderShop.shipping?.estimate?.processing_time_max_days;

  if (typeof maxDays !== 'number') {
    return '';
  }

  const createdAt = dayjs(orderShop.created_at);

  return createdAt.isValid()
    ? t('account.orders.progress.shipsBy', { date: createdAt.add(maxDays, 'day').format('MMM DD') })
    : '';
}

function buildUpdates(
  shipment: FulfillmentShipment,
  t: AccountTranslator,
): OrderPackageUpdate[] {
  return shipment.updates
    .map(update => ({
      id: update.id,
      title: shipmentUpdateTitle(update, t),
      location: update.location?.trim() || undefined,
      occurredAt: formatShortDateTime(update.occurred_at),
      occurredAtValue: dayjs(update.occurred_at).valueOf(),
    }))
    .sort((left, right) => right.occurredAtValue - left.occurredAtValue)
    .map(({
      id, title, location, occurredAt,
    }) => ({
      id,
      title,
      ...(location ? { location } : {}),
      occurredAt,
    }));
}

/** A shipment only exists once packed, so `placed`/`packed` are always complete here. */
function buildShipmentStages(
  orderShop: OrderShop,
  shipment: FulfillmentShipment,
  state: OrderPackageState,
  estimateDetail: string,
  shipByDetail: string,
  t: AccountTranslator,
): OrderPackageStage[] {
  if (state === 'canceled') {
    return [];
  }

  const shippedDetail = formatShortDateTime(shipment.dispatched_at);
  const deliveredComplete = state === 'delivered';
  const shippedComplete = Boolean(shipment.dispatched_at)
    || shipment.status === ShipmentStatuses.DISPATCHED
    || shipment.status === ShipmentStatuses.IN_TRANSIT
    || shipment.status === ShipmentStatuses.DELIVERED;
  const inTransitLabel = t('account.orders.progress.inTransit');

  return [
    {
      key: 'placed',
      label: t(STAGE_LABEL_KEY.placed),
      detail: formatShortDateTime(orderShop.created_at),
      complete: true,
    },
    {
      key: 'packed',
      label: t(STAGE_LABEL_KEY.packed),
      detail: formatShortDateTime(shipment.prepared_at),
      complete: true,
    },
    {
      key: 'shipped',
      label: t(STAGE_LABEL_KEY.shipped),
      detail: state === 'in_transit'
        ? (shippedDetail ? `${shippedDetail} · ${inTransitLabel}` : inTransitLabel)
        : shippedComplete ? shippedDetail : shipByDetail,
      complete: shippedComplete,
    },
    {
      key: 'delivered',
      label: t(STAGE_LABEL_KEY.delivered),
      detail: deliveredComplete ? formatShortDateTime(shipment.delivered_at) : estimateDetail,
      complete: deliveredComplete,
    },
  ];
}

function buildLegacyStages(
  orderShop: OrderShop,
  legacy: LegacyOrderShipping,
  state: OrderPackageState,
  estimateDetail: string,
  t: AccountTranslator,
): OrderPackageStage[] {
  if (state === 'canceled') {
    return [];
  }

  const shippedDetail = formatShortDateTime(legacy.shipped_at);
  const hasShipped = Boolean(legacy.shipped_at);
  const hasDelivered = Boolean(legacy.delivered_at);
  const inTransitLabel = t('account.orders.progress.inTransit');

  return [
    {
      key: 'placed',
      label: t(STAGE_LABEL_KEY.placed),
      detail: formatShortDateTime(orderShop.created_at),
      complete: true,
    },
    {
      key: 'packed',
      label: t(STAGE_LABEL_KEY.packed),
      detail: shippedDetail,
      complete: hasShipped || hasDelivered,
    },
    {
      key: 'shipped',
      label: t(STAGE_LABEL_KEY.shipped),
      detail: state === 'in_transit'
        ? (shippedDetail ? `${shippedDetail} · ${inTransitLabel}` : inTransitLabel)
        : shippedDetail,
      complete: hasShipped,
    },
    {
      key: 'delivered',
      label: t(STAGE_LABEL_KEY.delivered),
      detail: state === 'delivered' ? formatShortDateTime(legacy.delivered_at) : estimateDetail,
      complete: state === 'delivered',
    },
  ];
}

function buildProductLine(
  orderShop: OrderShop,
  product: OrderShopProduct,
  quantity: number,
  lineId: string,
): OrderPackageLine {
  const orderedQuantity = product.quantity > 0 ? product.quantity : 1;
  const unitPriceMinor = Math.round(product.amount_minor / orderedQuantity);

  return {
    id: lineId,
    orderItemId: product.id,
    title: product.title,
    imageUrl: product.image_url,
    variantLabels: product.product.selected_options.map(option => `${option.option_name}: ${option.value}`),
    quantity,
    unitPriceMinor,
    amountMinor: unitPriceMinor * quantity,
    currency: orderShop.currency,
  };
}

function buildLines(
  orderShop: OrderShop,
  items: FulfillmentShipmentItem[],
  packageId: string,
): OrderPackageLine[] {
  return items.flatMap((item) => {
    const product = orderShop.products.find(candidate => candidate.id === item.order_item_id);

    if (!product) {
      return [];
    }

    return [buildProductLine(orderShop, product, item.quantity, `${packageId}:${item.order_item_id}`)];
  });
}

function hasLegacyShippingSignal(orderShop: OrderShop): boolean {
  const legacy = orderShop.fulfillment.legacy_shipping;

  if (!legacy) {
    return false;
  }

  return Boolean(
    legacy.tracking_number
    || legacy.carrier
    || legacy.note
    || legacy.shipped_at
    || legacy.delivered_at,
  );
}

function buildLegacyPackage(
  orderShop: OrderShop,
  estimateDetail: string,
  shipByDetail: string,
  t: AccountTranslator,
): OrderPackage[] {
  const legacy = orderShop.fulfillment.legacy_shipping;

  if (!legacy || !hasLegacyShippingSignal(orderShop)) {
    return [];
  }

  const state = LEGACY_STATE_BY_STATUS[legacy.status] ?? 'preparing';
  const meta = PACKAGE_STATE_META[state];
  const statusDetail = state === 'delivered'
    ? formatShortDate(legacy.delivered_at)
    : formatShortDate(legacy.shipped_at);

  return [{
    id: 'legacy-package',
    index: 1,
    total: 1,
    state,
    statusLabel: t(meta.key),
    statusDetail,
    estimateDetail,
    shipByDetail,
    carrier: legacy.carrier,
    carrierName: legacy.carrier,
    trackingNumber: legacy.tracking_number,
    trackingUnverified: false,
    note: legacy.note,
    lines: buildLines(
      orderShop,
      orderShop.products.map(product => ({ order_item_id: product.id, quantity: product.quantity })),
      'legacy-package',
    ),
    stages: buildLegacyStages(orderShop, legacy, state, estimateDetail, t),
    updates: [],
  }];
}

/**
 * Buyer-facing packages: one per non-voided Shipment. Fulfillment groups are
 * allocation structure and never surface on their own; an order with no
 * shipments yet falls back to a single package derived from legacy shipping.
 */
export function buildOrderPackages(
  orderShop: OrderShop,
  t: AccountTranslator = translateAccount,
): OrderPackagesSummary {
  const estimateRange = formatShippingEstimateRange(orderShop.shipping?.estimate);
  const estimateDetail = estimateRange
    ? t('account.orders.progress.estimate', { range: estimateRange })
    : '';
  const shipByDetail = buildShipByDetail(orderShop, t);
  const shipments = orderShop.fulfillment.groups
    .flatMap(group => group.shipments)
    .filter(shipment => shipment.status !== ShipmentStatuses.VOIDED);

  const packages: OrderPackage[] = shipments.length > 0
    ? shipments.map((shipment, index) => {
      const state = mapShipmentState(shipment.status);
      const meta = PACKAGE_STATE_META[state];
      const statusDetail = state === 'delivered'
        ? formatShortDate(shipment.delivered_at)
        : formatShortDate(shipment.dispatched_at ?? shipment.prepared_at);

      return {
        id: shipment.id,
        index: index + 1,
        total: shipments.length,
        state,
        statusLabel: t(meta.key),
        statusDetail,
        estimateDetail,
        shipByDetail,
        carrier: shipment.carrier,
        carrierName: shipment.carrier_name ?? shipment.carrier,
        trackingNumber: shipment.tracking_number,
        trackingUnverified: shipment.carrier_observable === false && Boolean(shipment.tracking_number),
        note: shipment.shipment_note,
        lines: buildLines(orderShop, shipment.items, shipment.id),
        stages: buildShipmentStages(orderShop, shipment, state, estimateDetail, shipByDetail, t),
        updates: buildUpdates(shipment, t),
      };
    })
    : buildLegacyPackage(orderShop, estimateDetail, shipByDetail, t);

  return {
    packages,
    counts: {
      total: packages.length,
      delivered: packages.filter(pkg => pkg.state === 'delivered').length,
      inTransit: packages.filter(pkg => pkg.state === 'shipped' || pkg.state === 'in_transit').length,
      preparing: packages.filter(pkg => pkg.state === 'preparing').length,
      canceled: packages.filter(pkg => pkg.state === 'canceled').length,
    },
  };
}

/**
 * Order-level progress for an order with no packages yet: no shipment exists,
 * so every date comes from the order's processing window and estimate.
 */
export function buildOrderStages(
  orderShop: OrderShop,
  t: AccountTranslator = translateAccount,
): OrderPackageStage[] {
  const status = orderShop.fulfillment.status;
  const estimateRange = formatShippingEstimateRange(orderShop.shipping?.estimate);
  const estimateDetail = estimateRange
    ? t('account.orders.progress.estimate', { range: estimateRange })
    : '';
  const shipByDetail = buildShipByDetail(orderShop, t);
  const packedComplete = PACKED_STATUSES.has(status);
  const shippedComplete = SHIPPED_STATUSES.has(status);
  const deliveredComplete = status === FulfillmentAggregateStatuses.DELIVERED;

  return [
    {
      key: 'placed',
      label: t(STAGE_LABEL_KEY.placed),
      detail: formatShortDateTime(orderShop.created_at),
      complete: true,
    },
    {
      key: 'packed',
      label: t(STAGE_LABEL_KEY.packed),
      detail: packedComplete ? '' : t('account.orders.progress.sellerPreparing'),
      complete: packedComplete,
    },
    {
      key: 'shipped',
      label: t(STAGE_LABEL_KEY.shipped),
      detail: shippedComplete ? '' : shipByDetail,
      complete: shippedComplete,
    },
    {
      key: 'delivered',
      label: t(STAGE_LABEL_KEY.delivered),
      detail: estimateDetail,
      complete: deliveredComplete,
    },
  ];
}

/** Products in no non-voided shipment, at their full ordered quantity. */
export function buildAwaitingShipmentLines(orderShop: OrderShop): OrderPackageLine[] {
  const shipments = orderShop.fulfillment.groups
    .flatMap(group => group.shipments)
    .filter(shipment => shipment.status !== ShipmentStatuses.VOIDED);

  // The legacy fallback already presents the whole order as one package, and an
  // order with no shipment history and no legacy signal has nothing to place.
  if (shipments.length === 0 && hasLegacyShippingSignal(orderShop)) {
    return [];
  }

  const shippedItemIds = new Set(
    shipments.flatMap(shipment => shipment.items.map(item => item.order_item_id)),
  );

  return orderShop.products
    .filter(product => !shippedItemIds.has(product.id))
    .map(product => buildProductLine(
      orderShop,
      product,
      product.quantity,
      `awaiting:${product.id}`,
    ));
}

function mapShipmentState(status: ShipmentStatuses): OrderPackageState {
  switch (status) {
    case ShipmentStatuses.PREPARED:
      return 'preparing';
    case ShipmentStatuses.DISPATCHED:
      return 'shipped';
    case ShipmentStatuses.IN_TRANSIT:
      return 'in_transit';
    case ShipmentStatuses.DELIVERED:
      return 'delivered';
    default:
      return 'canceled';
  }
}

/** `1 delivered · 1 in transit · 1 preparing`, omitting empty buckets. */
export function formatPackageCounts(
  counts: OrderPackagesSummary['counts'],
  t: AccountTranslator = translateAccount,
): string {
  const parts: string[] = [];

  if (counts.delivered > 0) {
    parts.push(t('account.orders.packageCounts.delivered', { count: counts.delivered }));
  }
  if (counts.inTransit > 0) {
    parts.push(t('account.orders.packageCounts.inTransit', { count: counts.inTransit }));
  }
  if (counts.preparing > 0) {
    parts.push(t('account.orders.packageCounts.preparing', { count: counts.preparing }));
  }
  if (counts.canceled > 0) {
    parts.push(t('account.orders.packageCounts.canceled', { count: counts.canceled }));
  }

  return parts.join(' · ');
}

export function orderItemsCount(orderShop: OrderShop): number {
  return orderShop.products.reduce((count, product) => count + product.quantity, 0);
}

export function refundStatusLabel(
  status: NonNullable<Payment['refund_status']>,
  t: AccountTranslator = translateAccount,
): string {
  const key = status === 'not_required' ? 'notRequired' : status;

  return t(`account.orders.refunds.${key}`);
}

/**
 * `Visa •••• 4821` when the gateway shared the brand and last four, otherwise a
 * plain `Card`: the API only includes card details for buyers whose payment
 * provider captured them.
 */
export function paymentMethodLabel(
  payment: Payment,
  t: AccountTranslator = translateAccount,
): string {
  if (payment.type !== 'card') {
    return t('account.orders.summary.cash');
  }

  const brand = typeof payment.card_brand === 'string' ? payment.card_brand.trim() : '';
  const brandLabel = brand ? `${brand.charAt(0).toUpperCase()}${brand.slice(1)}` : '';
  const last4 = payment.card_last4 != null ? String(payment.card_last4) : '';

  if (brandLabel && last4) {
    return `${brandLabel} •••• ${last4}`;
  }

  return last4 ? `•••• ${last4}` : t('account.orders.summary.card');
}
