import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopPromoCodeApi } from '~/domains/shop/api/promo-code/promo-code.api';
import type { CreateShopPromoCodeRequestBody } from '~/domains/shop/api/promo-code/contracts/promo-code.contract';

export function useShopCreatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-promo-code'],
    mutationFn: async (body: CreateShopPromoCodeRequestBody) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopPromoCodeApi.create(shopId, body);
    },
  });
}
