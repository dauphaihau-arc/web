import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { resolveMyShopId } from '../resolve-my-shop-id'
import { shopProductApi } from '~/shared/api/shop/product/product.api'

export function useShopGetDetailProduct(
  id: string,
  options?: NitroFetchOptions<NitroFetchRequest>,
) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['shop-get-detail-product', id],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient)
      return shopProductApi.detail(shopId, id, options)
    },
  })
}
