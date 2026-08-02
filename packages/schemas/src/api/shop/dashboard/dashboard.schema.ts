import { z } from 'zod'
import { shopOrderSummarySchema } from '../order/order.schema'

export const shopDashboardTimeRangeSchema = z.enum([
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'this_month',
  'last_month',
  'all_time',
])

export const getShopDashboardRequestSchema = z.object({
  range: shopDashboardTimeRangeSchema.optional(),
})

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

export const shopDashboardTopProductSchema = z.object({
  product_id: z.string(),
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
    range: shopDashboardTimeRangeSchema,
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  summary: shopDashboardSummarySchema,
  revenue_series: z.array(shopDashboardRevenuePointSchema),
  recent_orders: z.array(shopOrderSummarySchema),
  top_selling_products: z.array(shopDashboardTopProductSchema),
})
