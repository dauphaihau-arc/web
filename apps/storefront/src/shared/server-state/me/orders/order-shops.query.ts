import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import type { RequestGetListParams } from '@arc/contracts/common'
import { meOrdersApi } from '~/shared/api/me/order/me-orders.api'
import type {
  GetMyOrderDetailResponse,
  GetOrderShopsByCheckoutSessionResponse,
} from '~/shared/api/me/order/contracts/order.contract'

export function useGetOrderShops(queryParams?: RequestGetListParams) {
  return useQuery({
    queryKey: ['get-order-shops', queryParams],
    queryFn: () => {
      return meOrdersApi.getShops(queryParams)
    },
    enabled: !!queryParams,
  })
}

export function useGetOrderById(orderId?: string) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ['get-order-by-id', orderId],
    queryFn: () => {
      return meOrdersApi.getById(orderId!) as Promise<GetMyOrderDetailResponse>
    },
  })
}

export function useGetOrderShopsByCheckoutSession(
  sessionId?: string,
  options?: NitroFetchOptions<NitroFetchRequest>,
) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: ['verify-cs'],
    queryFn: () => {
      return meOrdersApi.getShopsByCheckoutSession(
        sessionId!,
        options,
      ) as Promise<GetOrderShopsByCheckoutSessionResponse>
    },
  })
}
