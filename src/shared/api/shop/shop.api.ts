import type { Shop } from '~/shared/models/shop';
import { apiClient } from '~/shared/lib/api-client';

export type MyShopResponse = {
  id: string
  ownerUserId: string
  shop_name: string
  slug: string
  status: string
};

export type CreateShopRequest = Pick<Shop, 'shop_name'>;
export type CreateShopResponse = MyShopResponse;

export const shopApi = {
  create(payload: CreateShopRequest) {
    return apiClient.post<CreateShopResponse>(
      '/shops',
      payload
    );
  },

  getMine() {
    return apiClient.get<MyShopResponse>(
      '/shops/me'
    );
  },
};
