import type { QueryClient } from '@tanstack/vue-query';
import type { MyShop } from './shop.types';
import { apiClient } from '~/domains/_shared/api-client';

export async function resolveMyShopId(queryClient: QueryClient) {
  const cachedShop = queryClient.getQueryData<MyShop>(['my-shop']);

  if (cachedShop?.id) {
    return cachedShop.id;
  }

  const shop = await apiClient.get<MyShop>('/shops/me');
  queryClient.setQueryData(['my-shop'], shop);

  return shop.id;
}
