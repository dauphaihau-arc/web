import type {
  CreateShopSaleRequestBody,
  CreateShopSaleResponse,
  ListShopSalesRequest,
  ListShopSalesResponse,
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
};
