import { resolveMyShopId } from '../resolve-my-shop-id';
import { shopProductApi } from '~/shared/api/shop/product/product.api';
import type { GenerateProductDescriptionRequest } from '~/shared/api/shop/product/contracts/generate-description.contract';

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
