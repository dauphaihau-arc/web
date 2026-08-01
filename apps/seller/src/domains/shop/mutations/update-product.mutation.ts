import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { UpdateProductRequestBody } from '~/domains/shop/api/product/contracts/update-product.contract';

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
