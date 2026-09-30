import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopSaleApi } from '~/domains/shop/api/sale/sale.api';
import type { CreateShopSaleRequestBody } from '~/domains/shop/api/sale/contracts/sale.contract';

export function useShopCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-sale'],
    mutationFn: async (body: CreateShopSaleRequestBody) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopSaleApi.create(shopId, body);
    },
  });
}
