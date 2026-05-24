import type { MyShop } from './shop.types'
import { apiClient } from '~/shared/lib/api-client'

export async function resolveMyShopId(queryClient: ReturnType<typeof useQueryClient>) {
  const cachedShop = queryClient.getQueryData<MyShop>(['my-shop'])

  if (cachedShop?.id) {
    return cachedShop.id
  }

  const shop = await apiClient.get<MyShop>('/shops/me')
  queryClient.setQueryData(['my-shop'], shop)

  return shop.id
}
