import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { categoryIdentityQueryPolicy, getStatusCode, isCategoryIdentityMismatchError } from '@arc/lib';
import { resolveMyShopId } from '../../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';

export const SHOP_PRODUCT_DETAIL_QUERY_KEY = 'shop-get-detail-product';

export function useShopGetDetailProduct(
  id: string,
  options?: NitroFetchOptions<NitroFetchRequest>,
) {
  const queryClient = useQueryClient();
  return useQuery({
    ...categoryIdentityQueryPolicy(),
    queryKey: [SHOP_PRODUCT_DETAIL_QUERY_KEY, id],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.detail(shopId, id, options);
    },
    // A missing product never starts existing on retry: skip it so the not-found
    // state shows immediately. A category identity mismatch is terminal, so
    // never retry it; keep retries for transient failures only.
    retry: (failureCount, error) =>
      !isCategoryIdentityMismatchError(error)
      && getStatusCode(error) !== 404
      && failureCount < 3,
  });
}
