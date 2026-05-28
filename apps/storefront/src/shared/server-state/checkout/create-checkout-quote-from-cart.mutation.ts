import { checkoutApi } from '~/shared/api/checkout/checkout.api'
import type { CreateGuestCheckoutQuoteFromCartRequest } from '~/shared/api/checkout/contracts/checkout.contract'

export function useCreateGuestCheckoutQuoteFromCart() {
  return useMutation({
    mutationFn: (body: CreateGuestCheckoutQuoteFromCartRequest) => {
      return checkoutApi.createQuoteFromCart(body)
    },
  })
}
