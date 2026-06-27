import { meCheckoutApi } from '~/shared/api/me/checkout/me-checkout.api'
import type { CreateCheckoutQuoteForBuyNowRequest } from '~/shared/api/me/order/contracts/order.contract'

export function useCreateCheckoutQuoteForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateCheckoutQuoteForBuyNowRequest) => {
      return meCheckoutApi.createQuoteForBuyNow(body)
    },
  })
}
