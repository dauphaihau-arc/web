import type {
  CreateShopPromoCodeRequestBody,
  CreateShopPromoCodeResponse,
  ListShopPromoCodesRequest,
  ListShopPromoCodesResponse,
} from './contracts/promo-code.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const shopPromoCodeApi = {
  create(shopId: string, payload: CreateShopPromoCodeRequestBody) {
    return apiClient.post<CreateShopPromoCodeResponse>(
      `/shops/${shopId}/promo-codes`,
      payload,
    );
  },

  list(shopId: string, query?: ListShopPromoCodesRequest) {
    return apiClient.get<ListShopPromoCodesResponse>(
      `/shops/${shopId}/promo-codes`,
      query,
    );
  },
};
