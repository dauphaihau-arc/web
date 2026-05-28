import { meOrdersApi } from '~/shared/api/me/order/me-orders.api'
import type { CreateCheckoutQuoteForBuyNowRequest } from '~/shared/api/me/order/contracts/order.contract'

export function useCreateCheckoutQuoteForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateCheckoutQuoteForBuyNowRequest) => {
      return meOrdersApi.createQuoteForBuyNow(body)
    },
  })
}
