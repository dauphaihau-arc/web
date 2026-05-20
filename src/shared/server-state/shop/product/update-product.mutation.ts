import { resolveMyShopId } from '../resolve-my-shop-id';
import { shopProductApi } from '~/shared/api/shop/product/product.api';
import type { Product } from '~/shared/models/product';
import type { UpdateProductRequestBody } from '~/shared/api/shop/product/update';

export function useShopUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-update-product'],
    mutationFn: async (body: UpdateProductRequestBody & { id: Product['id'] }) => {
      const shopId = await resolveMyShopId(queryClient);
      const { id, ...resBody } = body;
      return shopProductApi.update(shopId, id, resBody);
    },
  });
}
