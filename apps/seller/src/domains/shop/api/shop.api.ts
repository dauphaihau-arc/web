import type {
  CreateShopRequest,
  CreateShopResponse,
  MyShopResponse,
  UpdateShopSettingsRequest,
} from './contracts/shop.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const shopApi = {
  create(payload: CreateShopRequest) {
    return apiClient.post<CreateShopResponse>(
      '/shops',
      payload,
    );
  },

  getMine() {
    return apiClient.get<MyShopResponse>(
      '/shops/me',
    );
  },

  /**
   * Persists the store settings. The store timezone is what a new Sale
   * schedule defaults to; existing Sales keep the timezone they were created
   * with.
   */
  updateSettings(shopId: string, payload: UpdateShopSettingsRequest) {
    return apiClient.patch<MyShopResponse>(
      `/shops/${shopId}/settings`,
      payload,
    );
  },
};
