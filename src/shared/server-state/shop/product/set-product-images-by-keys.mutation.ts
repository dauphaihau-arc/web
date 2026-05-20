import { resolveMyShopId } from '../resolve-my-shop-id';
import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
import type { CreateDraftProductResponse } from '~/shared/api/shop/product/create-draft';
import type { Product } from '~/shared/models/product';

export function useShopSetProductImagesByKeys() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-set-product-images-by-keys'],
    mutationFn: async (body: {
      id: Product['id']
      images: {
        storage_key: string
        rank: number
      }[]
    }) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.put<CreateDraftProductResponse>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${body.id}/images-by-keys`,
        {
          images: body.images,
        }
      );
    },
  });
}
