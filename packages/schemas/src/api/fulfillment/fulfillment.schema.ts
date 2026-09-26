import { z } from 'zod'
import {
  FulfillmentAggregateStatuses,
  FulfillmentMethods,
  FulfillmentOperators,
  FulfillmentProvenances,
  ShipmentJourneyStatuses,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment'

export const fulfillmentShipmentItemSchema = z.object({
  order_item_id: z.string(),
  quantity: z.number(),
})

export const fulfillmentShipmentUpdateSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(ShipmentStatuses),
  actor_type: z.nativeEnum(ShipmentUpdateActorTypes),
  actor_id: z.string().optional(),
  source: z.nativeEnum(ShipmentUpdateSources),
  occurred_at: z.coerce.date(),
  note: z.string().optional(),
})

export const fulfillmentShipmentSchema = z.object({
  id: z.string(),
  group_id: z.string(),
  status: z.nativeEnum(ShipmentStatuses),
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  shipment_note: z.string().optional(),
  origin_countries: z.array(z.string()),
  prepared_at: z.coerce.date(),
  dispatched_at: z.coerce.date().optional(),
  delivered_at: z.coerce.date().optional(),
  voided_at: z.coerce.date().optional(),
  created_at: z.coerce.date(),
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
  updated_at: z.coerce.date(),
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

export const amendFulfillmentShipmentRequestSchema = z.object({
  items: z.array(fulfillmentShipmentItemSchema).optional(),
  carrier: z.string().max(255).optional(),
  tracking_number: z.string().max(255).optional(),
  shipment_note: z.string().max(5000).optional(),
})

export const updateShipmentJourneyRequestSchema = z.object({
  status: z.nativeEnum(ShipmentJourneyStatuses),
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
