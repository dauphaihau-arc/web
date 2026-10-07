import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { getStatusCode } from '@arc/lib';
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
    // A missing product never starts existing on retry: skip it so the not-found
    // state shows immediately, and keep retries for transient failures only.
    retry: (failureCount, error) =>
      getStatusCode(error) !== 404 && failureCount < 3,
  });
}
