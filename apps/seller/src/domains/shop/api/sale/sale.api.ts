import type {
  BulkStopShopSalesRequest,
  BulkStopShopSalesResponse,
  CreateShopSaleRequestBody,
  CreateShopSaleResponse,
  ListShopSalesRequest,
  ListShopSalesResponse,
  ShopSaleStopResponse,
} from './contracts/sale.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const shopSaleApi = {
  create(shopId: string, payload: CreateShopSaleRequestBody) {
    return apiClient.post<CreateShopSaleResponse>(
      `/shops/${shopId}/sales`,
      payload,
    );
  },

  list(shopId: string, query?: ListShopSalesRequest) {
    return apiClient.get<ListShopSalesResponse>(
      `/shops/${shopId}/sales`,
      query,
    );
  },

  /**
   * Irreversibly cancels a scheduled Sale. The definition and its Order history
   * are retained; only future application stops.
   */
  cancel(shopId: string, saleId: string) {
    return apiClient.post<ShopSaleStopResponse>(
      `/shops/${shopId}/sales/${saleId}/cancel`,
    );
  },

  /**
   * Irreversibly ends an active Sale early, retaining its definition.
   */
  end(shopId: string, saleId: string) {
    return apiClient.post<ShopSaleStopResponse>(
      `/shops/${shopId}/sales/${saleId}/end`,
    );
  },

  /**
   * Cancels scheduled Sales and ends active Sales in one request.
   */
  bulkStop(shopId: string, payload: BulkStopShopSalesRequest) {
    return apiClient.post<BulkStopShopSalesResponse>(
      `/shops/${shopId}/sales/bulk-stop`,
      payload,
    );
  },
};
