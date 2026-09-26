import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { resolveMyShopId } from '../../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';

export const SHOP_PRODUCT_DETAIL_QUERY_KEY = 'shop-get-detail-product';

export function useShopGetDetailProduct(
  id: string,
  options?: NitroFetchOptions<NitroFetchRequest>,
) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [SHOP_PRODUCT_DETAIL_QUERY_KEY, id],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.detail(shopId, id, options);
    },
  });
}
