import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { GenerateProductDescriptionRequest } from '~/domains/shop/api/product/contracts/generate-description.contract';

export function useGenerateProductDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['shop-generate-product-description'],
    mutationFn: async (body: GenerateProductDescriptionRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.generateDescription(shopId, body);
    },
  });
}
