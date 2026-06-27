import { meCheckoutApi } from '~/shared/api/me/checkout/me-checkout.api'
import type { CreateOrderFromCartRequest } from '~/shared/api/me/order/contracts/order.contract'

export function useCreateOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateOrderFromCartRequest) => {
      return meCheckoutApi.createFromCart(body)
    },
  })
}
