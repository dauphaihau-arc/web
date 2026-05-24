import { resolveMyShopId } from '../resolve-my-shop-id'
import { shopOrderApi } from '~/shared/api/shop/order/order.api'

export function useShopGetOrderDetail(orderId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    enabled: !!orderId,
    queryKey: ['shop-order-detail', orderId],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient)
      return await shopOrderApi.detail(shopId, orderId!)
    },
  })
}
