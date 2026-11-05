import { z } from 'zod'
import type { components } from '../../generated/openapi'
import { shopOrderSummarySchema } from '../order/order.schema'
import { idSchema } from '@arc/schemas/primitives/id.schema'

/**
 * The dashboard response is kept hand-written: the contract types the period
 * bounds as ISO strings while this client models them as instants, and types
 * the order status as a plain string instead of `OrderStatuses`.
 */
export const shopDashboardSummarySchema = z.object({
  revenue_minor: z.number(),
  order_count: z.number(),
  items_sold: z.number(),
  average_order_value_minor: z.number(),
  currency: z.string(),
})

export const shopDashboardRevenuePointSchema = z.object({
  date: z.string(),
  label: z.string(),
  revenue_minor: z.number(),
  order_count: z.number(),
})

/**
 * Typed against the generated contract so a wire-key rename fails typecheck
 * instead of silently typing the UI against a field the API never sends.
 */
export const shopDashboardTopProductSchema: z.ZodType<
  components['schemas']['ShopDashboardTopProductResponseDto']
> = z.object({
  product_id: idSchema,
  title: z.string(),
  slug: z.string(),
  image_url: z.string().optional(),
  quantity_sold: z.number(),
  order_count: z.number(),
  revenue_minor: z.number(),
  currency: z.string(),
})

export const shopDashboardResponseSchema = z.object({
  period: z.object({
    range: z.enum([
      'today',
      'yesterday',
      'last_7_days',
      'last_30_days',
      'this_month',
      'last_month',
      'all_time',
    ]),
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  summary: shopDashboardSummarySchema,
  revenue_series: z.array(shopDashboardRevenuePointSchema),
  recent_orders: z.array(shopOrderSummarySchema),
  top_selling_products: z.array(shopDashboardTopProductSchema),
})
