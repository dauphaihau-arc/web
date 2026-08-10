import { RESOURCES } from '@arc/enums/resources';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { apiClient } from '~/shared/lib/api-client';
import type { CreateDraftProductResponse } from '~/domains/shop/api/product/contracts/create-draft.contract';

export function useShopPublishProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-publish-product'],
    mutationFn: async (id: string) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.post<CreateDraftProductResponse>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${id}/publish`,
      );
    },
  });
}
