import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const shippingDestinationScopes = ['country', 'everywhere_else'] as const
export const shippingProfileStatuses = ['draft', 'active', 'archived'] as const
export const shippingProfileReadinessIssues = [
  'archived',
  'draft',
  'missing_name',
  'missing_rates',
  'missing_processing_time',
  'invalid_processing_time',
  'missing_delivery_time',
  'invalid_delivery_time',
] as const

/** Seller-configured elapsed calendar-day range. */
export const shippingDurationRangeSchema = z.object({
  min_days: z.number().int().nonnegative(),
  max_days: z.number().int().nonnegative(),
})

export const shippingEstimateSchema = z.object({
  combined_min_days: z.number().int().nonnegative(),
  combined_max_days: z.number().int().nonnegative(),
  // Server-owned UTC instant the estimate was anchored to.
  anchor_at: z.union([z.string(), z.date()]),
  earliest_delivery_date: z.union([z.string(), z.date()]),
  latest_delivery_date: z.union([z.string(), z.date()]),
})

export const shippingDestinationScopeSchema = z.enum(shippingDestinationScopes)
export const shippingProfileStatusSchema = z.enum(shippingProfileStatuses)

export const shippingRateSchema = z.object({
  id: idSchema,
  position: z.number().int().positive(),
  destination_scope: shippingDestinationScopeSchema,
  destination_country: z.string().optional(),
  one_item_fee_minor: z.number().int().nonnegative(),
  additional_item_fee_minor: z.number().int().nonnegative(),
  delivery_time_min_days: z.number().int().nonnegative().optional(),
  delivery_time_max_days: z.number().int().nonnegative().optional(),
})

export const shippingRateInputSchema = shippingRateSchema.omit({
  id: true,
  position: true,
})

export const shippingProfileSchema = z.object({
  id: idSchema,
  shop_id: idSchema,
  name: z.string(),
  status: shippingProfileStatusSchema,
  version: z.number().int().positive(),
  // Resolved from the owning Shop. Profiles never store their own currency.
  currency: z.string(),
  ship_from_country: z.string().optional(),
  ship_from_postal: z.string().optional(),
  processing_time_min_days: z.number().int().nonnegative().optional(),
  processing_time_max_days: z.number().int().nonnegative().optional(),
  checkout_ready: z.boolean(),
  readiness_issues: z.array(z.enum(shippingProfileReadinessIssues)),
  /** True when this profile is the shop's Default Shipping Profile. */
  is_default: z.boolean(),
  assigned_product_count: z.number().int().nonnegative(),
  published_product_count: z.number().int().nonnegative(),
  rates: z.array(shippingRateSchema),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
})

export const shippingProfileStatusCountsSchema = z.object({
  active: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  archived: z.number().int().nonnegative(),
})

export const shippingProfileListSchema = z.object({
  results: z.array(shippingProfileSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
  // Counts across every page, so the surface can show that hidden states exist.
  status_counts: shippingProfileStatusCountsSchema,
})

export const shippingRatePreviewSchema = z.object({
  shipping_profile_id: idSchema,
  shop_id: idSchema,
  currency: z.string(),
  checkout_ready: z.boolean(),
  readiness_issues: z.array(z.enum(shippingProfileReadinessIssues)),
  matched: z.boolean(),
  rate: shippingRateSchema.optional(),
  quantity: z.number().int().positive().optional(),
  base_item_total_minor: z.number().int().nonnegative().optional(),
  additional_items_quantity: z.number().int().nonnegative().optional(),
  additional_items_total_minor: z.number().int().nonnegative().optional(),
  total_minor: z.number().int().nonnegative().optional(),
  processing_time: shippingDurationRangeSchema.optional(),
  delivery_time: shippingDurationRangeSchema.optional(),
  estimate: shippingEstimateSchema.optional(),
})
