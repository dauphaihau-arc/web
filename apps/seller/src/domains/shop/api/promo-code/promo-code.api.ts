import type {
  BulkStopShopPromoCodesRequest,
  BulkStopShopPromoCodesResponse,
  CreateShopPromoCodeRequestBody,
  CreateShopPromoCodeResponse,
  ListShopPromoCodesRequest,
  ListShopPromoCodesResponse,
  ShopPromoCodeStopResponse,
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

  /**
   * Irreversibly cancels a scheduled Promo Code. The definition, its code
   * identity, its consumed allowances and its Order history are retained; only
   * future application and discovery stop.
   */
  cancel(shopId: string, promoCodeId: string) {
    return apiClient.post<ShopPromoCodeStopResponse>(
      `/shops/${shopId}/promo-codes/${promoCodeId}/cancel`,
    );
  },

  /**
   * Irreversibly ends an active Promo Code early, retaining its definition.
   */
  end(shopId: string, promoCodeId: string) {
    return apiClient.post<ShopPromoCodeStopResponse>(
      `/shops/${shopId}/promo-codes/${promoCodeId}/end`,
    );
  },

  /**
   * Cancels scheduled Promo Codes and ends active Promo Codes in one request.
   */
  bulkStop(shopId: string, payload: BulkStopShopPromoCodesRequest) {
    return apiClient.post<BulkStopShopPromoCodesResponse>(
      `/shops/${shopId}/promo-codes/bulk-stop`,
      payload,
    );
  },
};
