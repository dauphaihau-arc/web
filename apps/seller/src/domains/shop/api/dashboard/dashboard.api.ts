import type {
  GetShopDashboardRequest,
  ShopDashboardResponse
} from './contracts/dashboard.contract';
import { apiClient } from '~/shared/lib/api-client';

export const shopDashboardApi = {
  get(shopId: string, query?: GetShopDashboardRequest) {
    return apiClient.get<ShopDashboardResponse>(
      `/shops/${shopId}/dashboard`,
      query
    );
  },
};
