import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { SetProductImagesByKeysRequestBody } from '~/domains/shop/api/product/contracts/update-product.contract';

export function useShopSetProductImagesByKeys() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-set-product-images-by-keys'],
    mutationFn: async (body: {
      id: string
      images: SetProductImagesByKeysRequestBody['images']
    }) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.setImagesByKeys(shopId, body.id, {
        images: body.images,
        idempotency_key: crypto.randomUUID(),
      });
    },
  });
}
