import { z } from 'zod'
import {
  FulfillmentAggregateStatuses,
  FulfillmentMethods,
  FulfillmentOperators,
  FulfillmentProvenances,
  ShipmentLabelStatuses,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment'

export const shipmentRateServiceSchema = z.enum(['standard', 'express'])

export const fulfillmentShipmentItemSchema = z.object({
  order_item_id: z.string(),
  quantity: z.number(),
})

/**
 * The carrier label bought for a shipment. The PDF itself is not part of the
 * shipment read model; it is downloaded separately.
 */
export const fulfillmentShipmentLabelSchema = z.object({
  public_id: z.string(),
  service: shipmentRateServiceSchema,
  status: z.nativeEnum(ShipmentLabelStatuses),
  price_minor: z.number().int().nonnegative(),
  currency: z.string(),
})

export const fulfillmentShipmentUpdateSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(ShipmentStatuses),
  actor_type: z.nativeEnum(ShipmentUpdateActorTypes),
  actor_id: z.string().optional(),
  source: z.nativeEnum(ShipmentUpdateSources),
  occurred_at: z.coerce.date(),
  note: z.string().optional(),
  event_code: z.string().optional(),
  location: z.string().optional(),
})

export const fulfillmentShipmentSchema = z.object({
  id: z.string(),
  group_id: z.string(),
  status: z.nativeEnum(ShipmentStatuses),
  carrier: z.string().optional(),
  /** Display name resolved server-side from the carrier code. */
  carrier_name: z.string().optional(),
  /** Whether the carrier exposes tracking events to this platform. */
  carrier_observable: z.boolean().optional(),
  tracking_number: z.string().optional(),
  shipment_note: z.string().optional(),
  label: fulfillmentShipmentLabelSchema.nullable().optional(),
  origin_countries: z.array(z.string()),
  prepared_at: z.coerce.date(),
  dispatched_at: z.coerce.date().optional(),
  delivered_at: z.coerce.date().optional(),
  voided_at: z.coerce.date().optional(),
  created_at: z.string(),
  updated_at: z.coerce.date(),
  items: z.array(fulfillmentShipmentItemSchema),
  updates: z.array(fulfillmentShipmentUpdateSchema),
})

export const fulfillmentProgressSchema = z.object({
  ordered: z.number(),
  prepared: z.number(),
  dispatched: z.number(),
  delivered: z.number(),
  canceled: z.number(),
  outstanding: z.number(),
})

export const fulfillmentGroupSchema = z.object({
  id: z.string(),
  method: z.nativeEnum(FulfillmentMethods),
  operator: z.nativeEnum(FulfillmentOperators),
  provenance: z.nativeEnum(FulfillmentProvenances),
  items: z.array(fulfillmentShipmentItemSchema),
  progress: fulfillmentProgressSchema,
  shipments: z.array(fulfillmentShipmentSchema),
})

export const legacyOrderShippingSchema = z.object({
  status: z.string(),
  updated_at: z.string(),
  to_country: z.string(),
  from_countries: z.array(z.string()),
  estimated_delivery: z.coerce.date(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  note: z.string().optional(),
  shipped_at: z.coerce.date().optional(),
  delivered_at: z.coerce.date().optional(),
})

export const orderFulfillmentSchema = z.object({
  status: z.nativeEnum(FulfillmentAggregateStatuses),
  requires_reconciliation: z.boolean(),
  progress: fulfillmentProgressSchema,
  groups: z.array(fulfillmentGroupSchema),
  legacy_shipping: legacyOrderShippingSchema,
})

export const prepareFulfillmentShipmentRequestSchema = z.object({
  group_id: z.string().optional(),
  items: z.array(fulfillmentShipmentItemSchema).optional(),
  carrier: z.string().max(255).optional(),
  tracking_number: z.string().max(255).optional(),
  shipment_note: z.string().max(5000).optional(),
})

/**
 * A label purchase names the rate quote the seller chose. The quote already
 * carries the carrier price; the group and items tell the API which quantities
 * the label covers.
 */
export const purchaseShipmentLabelRequestSchema = z.object({
  quote_id: z.string(),
  group_id: z.string().optional(),
  items: z.array(fulfillmentShipmentItemSchema).min(1),
})

export const amendFulfillmentShipmentRequestSchema = z.object({
  items: z.array(fulfillmentShipmentItemSchema).optional(),
  carrier: z.string().max(255).optional(),
  tracking_number: z.string().max(255).optional(),
  shipment_note: z.string().max(5000).optional(),
})

export const reconcileOrderFulfillmentRequestSchema = z.object({
  items: z.array(fulfillmentShipmentItemSchema),
})

export const fulfillmentMutationResponseSchema = z.object({
  fulfillment: orderFulfillmentSchema,
})

export const carrierSchema = z.object({
  code: z.string(),
  name: z.string(),
  tracking_pattern: z.string().nullable().optional(),
  tracking_hint: z.string().nullable().optional(),
  observable: z.boolean(),
  label_supported: z.boolean(),
})

export const carrierCatalogueResponseSchema = z.object({
  carriers: z.array(carrierSchema),
})

export const shipmentRatesRequestSchema = z.object({
  weight_grams: z.number().int().positive(),
  length_cm: z.number().int().positive(),
  width_cm: z.number().int().positive(),
  height_cm: z.number().int().positive(),
})

export const shipmentRateEstimatedDaysSchema = z.object({
  min: z.number().int().positive(),
  max: z.number().int().positive(),
})

export const shipmentRateQuoteSchema = z.object({
  quote_id: z.string(),
  carrier: z.string(),
  /** Display name resolved server-side from the carrier code. */
  service: shipmentRateServiceSchema,
  /** Carrier price in the shop's Settlement Currency, integer minor units. */
  price_minor: z.number().int().nonnegative(),
  currency: z.string(),
  estimated_days: shipmentRateEstimatedDaysSchema,
  expires_at: z.string(),
})

export const shipmentRatesResponseSchema = z.object({
  rates: z.array(shipmentRateQuoteSchema),
})

export type Carrier = z.infer<typeof carrierSchema>
export type CarrierCatalogueResponse = z.infer<typeof carrierCatalogueResponseSchema>
export type FulfillmentShipmentLabel = z.infer<typeof fulfillmentShipmentLabelSchema>
export type PurchaseShipmentLabelRequest = z.infer<typeof purchaseShipmentLabelRequestSchema>
export type ShipmentRateService = z.infer<typeof shipmentRateServiceSchema>
export type ShipmentRatesRequest = z.infer<typeof shipmentRatesRequestSchema>
export type ShipmentRateQuote = z.infer<typeof shipmentRateQuoteSchema>
export type ShipmentRatesResponse = z.infer<typeof shipmentRatesResponseSchema>
