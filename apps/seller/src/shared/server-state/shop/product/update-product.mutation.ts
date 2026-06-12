import { resolveMyShopId } from '../resolve-my-shop-id';
import { shopProductApi } from '~/shared/api/shop/product/product.api';
import type { UpdateProductRequestBody } from '~/shared/api/shop/product/contracts/update-product.contract';

export function useShopUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-update-product'],
    mutationFn: async (body: UpdateProductRequestBody & { id: string }) => {
      const shopId = await resolveMyShopId(queryClient);
      const { id, ...resBody } = body;
      return shopProductApi.update(shopId, id, resBody);
    },
  });
}
