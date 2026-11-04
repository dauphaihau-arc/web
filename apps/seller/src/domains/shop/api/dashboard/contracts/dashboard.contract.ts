import type { z } from 'zod';
import type { operations } from '@arc/schemas/api/generated/openapi';
import type { shopDashboardResponseSchema } from '@arc/schemas/api/shop/dashboard/dashboard.schema';

type ShopDashboardQuery = NonNullable<
  operations['ShopDashboard_overview']['parameters']['query']
>;

export type ShopDashboardTimeRange = NonNullable<ShopDashboardQuery['range']>;
export type GetShopDashboardRequest = ShopDashboardQuery;
export type ShopDashboardResponse = z.infer<typeof shopDashboardResponseSchema>;
