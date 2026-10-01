import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopApi } from '~/domains/shop/api/shop.api';
import type { UpdateShopSettingsRequest } from '~/domains/shop/api/contracts/shop.contract';

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['update-shop-settings'],
    mutationFn: async (payload: UpdateShopSettingsRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopApi.updateSettings(shopId, payload);
    },
    /**
     * The endpoint answers with the same shop shape as `GET /shops/me`, so the
     * cached store is refreshed from the write rather than refetched.
     */
    onSuccess: (shop) => {
      queryClient.setQueryData(['my-shop'], shop);
    },
  });
}
