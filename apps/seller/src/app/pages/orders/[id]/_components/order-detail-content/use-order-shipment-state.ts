import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { OrderStatuses } from '@arc/enums/order';
import {
  ShipmentLabelStatuses,
  ShipmentStatuses,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';

const SHIPMENT_BLOCKED_ORDER_STATUSES = [
  OrderStatuses.CHECKOUT_PENDING,
  OrderStatuses.CANCELED,
  OrderStatuses.REFUNDED,
  OrderStatuses.EXPIRED,
  OrderStatuses.ARCHIVED,
  OrderStatuses.AWAITING_PAYMENT,
];

/** Kept in step with the API: three days after the Handover Declaration. */
const HANDOVER_EDIT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

type ShipmentStateView = ShopOrder['fulfillment']['groups'][number]['shipments'][number];

/**
 * What a seller may still do on one Shipment. The seller declares handover and
 * keeps editing carrier details for three days, until the carrier scans;
 * everything after handover belongs to the carrier.
 */
export function useOrderShipmentState(
  orderSource: MaybeRefOrGetter<ShopOrder | undefined>,
  shipmentSource: MaybeRefOrGetter<ShipmentStateView | undefined>,
) {
  const order = computed(() => toValue(orderSource));
  const shipment = computed(() => toValue(shipmentSource));

  const shipmentUpdatesBlocked = computed(() =>
    !!order.value && SHIPMENT_BLOCKED_ORDER_STATUSES.includes(order.value.status),
  );

  /**
   * A declaration needs something to declare: a prepared Shipment with the
   * carrier and tracking number the API requires.
   */
  const canDeclareHandover = computed(() =>
    !shipmentUpdatesBlocked.value
    && shipment.value?.status === ShipmentStatuses.PREPARED
    && Boolean(shipment.value.carrier)
    && Boolean(shipment.value.tracking_number),
  );

  /**
   * A prepared Shipment is always editable. After handover, carrier and tracking
   * stay correctable for the window, unless a carrier scan already landed.
   */
  const canEditShipmentInfo = computed(() => {
    if (shipmentUpdatesBlocked.value || !shipment.value) return false;

    if (shipment.value.status === ShipmentStatuses.PREPARED) return true;

    if (shipment.value.status !== ShipmentStatuses.DISPATCHED) return false;

    const dispatchedAt = shipment.value.dispatched_at;
    if (!dispatchedAt) return false;

    const elapsed = Date.now() - new Date(dispatchedAt).getTime();
    if (elapsed > HANDOVER_EDIT_WINDOW_MS) return false;

    return !shipment.value.updates.some(update => update.source === ShipmentUpdateSources.CARRIER);
  });

  const canVoidShipment = computed(() =>
    !shipmentUpdatesBlocked.value
    && shipment.value?.status === ShipmentStatuses.PREPARED
    && !shipment.value.label,
  );

  /** A voided label's PDF is no longer a valid shipping document. */
  const canPrintShipmentLabel = computed(() =>
    !!shipment.value?.label
    && shipment.value.label.status !== ShipmentLabelStatuses.VOIDED,
  );

  /**
   * Only an unused label can be refunded: once the carrier scans the parcel the
   * purchase is consumed. Handover alone (dispatched, no scan yet) still leaves
   * the label refundable.
   */
  const canRefundShipmentLabel = computed(() => {
    if (shipmentUpdatesBlocked.value || !shipment.value) return false;

    const { label, status, updates } = shipment.value;
    if (!label || label.status !== ShipmentLabelStatuses.PURCHASED) return false;

    if (status === ShipmentStatuses.PREPARED) return true;
    if (status !== ShipmentStatuses.DISPATCHED) return false;

    return !updates.some(update => update.source === ShipmentUpdateSources.CARRIER);
  });

  return {
    canDeclareHandover,
    canEditShipmentInfo,
    canVoidShipment,
    canPrintShipmentLabel,
    canRefundShipmentLabel,
    shipmentUpdatesBlocked,
  };
}
