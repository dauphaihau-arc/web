import type { ComputedRef, Ref } from 'vue';
import { resolveMyShopId } from '../../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type {
  ListShopProductsRequest,
  ListShopProductsResponse,
} from '~/domains/shop/api/product/contracts/read.contract';

export function useShopGetProducts(
  queryParams: Ref<ListShopProductsRequest> | ComputedRef<ListShopProductsRequest>,
) {
  const queryClient = useQueryClient();
  return useQuery<ListShopProductsResponse>({
    queryKey: ['shop-get-products', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.list(shopId, queryParams.value);
    },
  });
}
