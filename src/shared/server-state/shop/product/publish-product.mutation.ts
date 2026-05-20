import { resolveMyShopId } from '../resolve-my-shop-id';
import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
import type { CreateDraftProductResponse } from '~/shared/api/shop/product/create-draft';
import type { Product } from '~/shared/models/product';

export function useShopPublishProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-publish-product'],
    mutationFn: async (id: Product['id']) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.post<CreateDraftProductResponse>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${id}/publish`
      );
    },
  });
}
