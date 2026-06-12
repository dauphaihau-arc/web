import { RESOURCES } from '@arc/enums/resources';
import { resolveMyShopId } from '../resolve-my-shop-id';
import { apiClient } from '~/shared/lib/api-client';

export function useShopSetProductImagesByKeys() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-set-product-images-by-keys'],
    mutationFn: async (body: {
      id: string
      images: {
        storage_key: string
        rank: number
      }[]
    }) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.put<undefined>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${body.id}/images-by-keys`,
        {
          images: body.images,
        }
      );
    },
  });
}
