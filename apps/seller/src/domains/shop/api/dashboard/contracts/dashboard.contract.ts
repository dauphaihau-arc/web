import type { components, operations } from '@arc/schemas/api/generated/openapi';

type ShopDashboardQuery = NonNullable<
  operations['ShopDashboard_overview']['parameters']['query']
>;

export type ShopDashboardTimeRange = NonNullable<ShopDashboardQuery['range']>;
export type GetShopDashboardRequest = ShopDashboardQuery;
/**
 * The dashboard contract types every date-time as an ISO string and `status`
 * as the wire string, so the generated response is the whole truth here.
 * Render dates through `formatShortDateTime` instead of holding Date objects.
 */
export type ShopDashboardResponse = components['schemas']['ShopDashboardResponseDto'];
export type ShopDashboardRecentOrder =
  components['schemas']['ShopOrderSummaryResponseDto'];
