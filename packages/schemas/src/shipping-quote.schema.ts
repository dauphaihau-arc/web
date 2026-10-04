import { z } from 'zod'
import { PromotionMinOrderType, PromotionProductScope } from '@arc/enums/promotion'
import { idSchema } from '@arc/schemas/primitives/id.schema'
import {
  shippingDestinationScopeSchema,
  shippingEstimateSchema,
} from '@arc/schemas/shipping-profile.schema'

/**
 * Accepted per-shop shipping facts shared by checkout quotes and confirmed
 * Orders. The server writes this snapshot once and reads it back unchanged, so
 * later Shipping Profile, rate, or Processing/Delivery edits cannot rewrite the
 * money or estimate a buyer accepted.
 */
export const shippingQuoteUnitSchema = z.object({
  product_id: idSchema,
  inventory_id: idSchema,
  quantity: z.number().int().positive(),
  profile_id: idSchema,
  profile_version: z.number().int().positive(),
  profile_shop_id: idSchema,
  rate_id: idSchema,
  rate_destination_scope: shippingDestinationScopeSchema,
  rate_destination_country: z.string().optional(),
  currency: z.string(),
  one_item_fee_minor: z.number().int().nonnegative(),
  additional_item_fee_minor: z.number().int().nonnegative(),
  /**
   * Seller-configured amounts in the owning shop's currency. Present only when
   * the shop's currency differed from the checkout currency and the accepted
   * fees above were converted through the server's FX seam.
   */
  source_currency: z.string().optional(),
  source_one_item_fee_minor: z.number().int().nonnegative().optional(),
  source_additional_item_fee_minor: z.number().int().nonnegative().optional(),
  fx: z
    .object({
      rate: z.string(),
      source: z.string(),
      effective_at: z.string(),
      source_timestamp: z.string().optional(),
    })
    .optional(),
  processing_time_min_days: z.number().int().nonnegative(),
  processing_time_max_days: z.number().int().nonnegative(),
  delivery_time_min_days: z.number().int().nonnegative(),
  delivery_time_max_days: z.number().int().nonnegative(),
})

export const shippingQuoteAdditionalComponentSchema = z.object({
  product_id: idSchema,
  inventory_id: idSchema,
  quantity: z.number().int().positive(),
  additional_item_fee_minor: z.number().int().nonnegative(),
})

export const shippingQuoteChargeSchema = z.object({
  currency: z.string(),
  quantity: z.number().int().positive(),
  base_unit: z.object({
    product_id: idSchema,
    inventory_id: idSchema,
    one_item_fee_minor: z.number().int().nonnegative(),
  }),
  base_item_fee_minor: z.number().int().nonnegative(),
  base_item_total_minor: z.number().int().nonnegative(),
  additional_items_quantity: z.number().int().nonnegative(),
  additional_components: z.array(shippingQuoteAdditionalComponentSchema),
  additional_item_fee_minor_total: z.number().int().nonnegative(),
  total_minor: z.number().int().nonnegative(),
})

export const checkoutShippingEstimateSchema = shippingEstimateSchema.extend({
  processing_time_min_days: z.number().int().nonnegative(),
  processing_time_max_days: z.number().int().nonnegative(),
  delivery_time_min_days: z.number().int().nonnegative(),
  delivery_time_max_days: z.number().int().nonnegative(),
})

export const checkoutShippingQuoteSchema = z.object({
  shop_id: idSchema,
  currency: z.string(),
  charge: shippingQuoteChargeSchema,
  estimate: checkoutShippingEstimateSchema,
  units: z.array(shippingQuoteUnitSchema),
})

/** Provenance of a free-shipping waiver applied to the calculated charge. */
export const shippingDiscountSchema = z.object({
  promotion_id: idSchema,
  code: z.string(),
  benefit_type: z.literal('free_shipping'),
  product_scope: z.nativeEnum(PromotionProductScope),
  product_ids: z.array(idSchema),
  min_order_type: z.nativeEnum(PromotionMinOrderType),
  min_order_value: z.number(),
  min_purchase_quantity: z.number(),
  max_redemptions: z.number(),
  max_redemptions_per_buyer: z.number(),
  redemption_count: z.number(),
  waived_minor: z.number().int().nonnegative(),
  currency: z.string(),
})

/**
 * Per-shop shipping money as returned on checkout quotes and confirmed Order
 * responses: the immutable Shipping Charge snapshot plus free-shipping waiver
 * provenance. Orders created before shipping quotes exist omit it.
 */
export const acceptedShippingFieldsSchema = z.object({
  shipping: checkoutShippingQuoteSchema.optional(),
  shipping_discount_minor: z.number().optional(),
  shipping_discounts: z.array(shippingDiscountSchema).optional(),
})

export type ShippingQuoteUnit = z.infer<typeof shippingQuoteUnitSchema>
export type ShippingQuoteCharge = z.infer<typeof shippingQuoteChargeSchema>
export type CheckoutShippingEstimate = z.infer<typeof checkoutShippingEstimateSchema>
export type CheckoutShippingQuote = z.infer<typeof checkoutShippingQuoteSchema>
export type ShippingDiscount = z.infer<typeof shippingDiscountSchema>
