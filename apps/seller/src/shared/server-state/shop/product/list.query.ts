import type { ComputedRef, Ref } from 'vue'
import { resolveMyShopId } from '../resolve-my-shop-id'
import { shopProductApi } from '~/shared/api/shop/product/product.api'
import type {
  ListShopProductsRequest,
  ListShopProductsResponse,
} from '~/shared/api/shop/product/contracts/read.contract'

export function useShopGetProducts(
  queryParams: Ref<ListShopProductsRequest> | ComputedRef<ListShopProductsRequest>,
) {
  const queryClient = useQueryClient()
  return useQuery<ListShopProductsResponse>({
    queryKey: ['shop-get-products', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient)
      return shopProductApi.list(shopId, queryParams.value)
    },
  })
}
