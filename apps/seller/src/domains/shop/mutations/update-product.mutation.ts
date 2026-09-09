import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { UpdateProductDetailsRequestBody } from '~/domains/shop/api/product/contracts/update-product.contract';

export function useShopUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-update-product'],
    mutationFn: async (body: UpdateProductDetailsRequestBody & { id: string }) => {
      const shopId = await resolveMyShopId(queryClient);
      const { id, ...resBody } = body;
      return shopProductApi.updateDetails(shopId, id, resBody);
    },
  });
}
