import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { CreateDraftProductRequest } from '~/domains/shop/api/product/contracts/create-draft.contract';

export function useShopCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-product'],
    mutationFn: async (body: CreateDraftProductRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.createDraft(shopId, body);
    },
  });
}
