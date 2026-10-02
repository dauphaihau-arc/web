import type { ComputedRef } from 'vue';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopPromoCodeApi } from '~/domains/shop/api/promo-code/promo-code.api';
import type {
  ListShopPromoCodesRequest,
  ListShopPromoCodesResponse,
} from '~/domains/shop/api/promo-code/contracts/promo-code.contract';

export function useShopGetPromoCodes(queryParams: ComputedRef<ListShopPromoCodesRequest>) {
  const queryClient = useQueryClient();
  return useQuery<ListShopPromoCodesResponse>({
    queryKey: ['shop-get-promo-codes', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopPromoCodeApi.list(shopId, queryParams.value);
    },
  });
}
