export enum FulfillmentMethods {
  SELLER = 'seller',
  PROVIDER = 'provider',
}

export enum FulfillmentOperators {
  SELLER = 'seller',
  ARC = 'arc',
}

export enum FulfillmentProvenances {
  CONFIRMED_ORDER = 'confirmed_order',
  LEGACY_RECONCILIATION = 'legacy_reconciliation',
}

export enum ShipmentStatuses {
  PREPARED = 'prepared',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  VOIDED = 'voided',
}

export enum ShipmentJourneyStatuses {
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
}

export enum ShipmentUpdateActorTypes {
  SYSTEM = 'system',
  SELLER = 'seller',
  BUYER = 'buyer',
  CARRIER = 'carrier',
  ADMIN = 'admin',
}

export enum ShipmentUpdateSources {
  SELLER = 'seller',
  BUYER = 'buyer',
  CARRIER = 'carrier',
  SYSTEM = 'system',
  CHECKOUT = 'checkout',
  LEGACY_RECONCILIATION = 'legacy_reconciliation',
  ADMIN = 'admin',
}

/**
 * Aggregate, collection-level fulfillment status for one Order. It is separate
 * from an individual Shipment's journey status. `dispatched`/`in_transit` remain
 * for the legacy order-level projection; quantity-based progress reports
 * `partially_shipped`/`shipped` and folds in-transit into shipped.
 */
export enum FulfillmentAggregateStatuses {
  UNFULFILLED = 'unfulfilled',
  PREPARED = 'prepared',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  PARTIALLY_DELIVERED = 'partially_delivered',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
}
