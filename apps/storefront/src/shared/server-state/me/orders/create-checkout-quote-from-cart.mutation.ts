import { meOrdersApi } from '~/shared/api/me/order/me-orders.api'
import type { CreateCheckoutQuoteFromCartRequest } from '~/shared/api/me/order/contracts/order.contract'

export function useCreateCheckoutQuoteFromCart() {
  return useMutation({
    mutationFn: (body: CreateCheckoutQuoteFromCartRequest) => {
      return meOrdersApi.createQuoteFromCart(body)
    },
  })
}
