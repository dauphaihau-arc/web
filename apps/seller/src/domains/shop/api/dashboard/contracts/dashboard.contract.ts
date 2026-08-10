import type { z } from 'zod';
import type {
  getShopDashboardRequestSchema,
  shopDashboardResponseSchema,
  shopDashboardTimeRangeSchema,
} from '@arc/schemas/api/shop/dashboard/dashboard.schema';

export type ShopDashboardTimeRange = z.infer<typeof shopDashboardTimeRangeSchema>;
export type GetShopDashboardRequest = z.infer<typeof getShopDashboardRequestSchema>;
export type ShopDashboardResponse = z.infer<typeof shopDashboardResponseSchema>;
