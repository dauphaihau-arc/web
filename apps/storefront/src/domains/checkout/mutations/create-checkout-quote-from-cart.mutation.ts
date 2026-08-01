import { checkoutApi } from '~/domains/checkout/api/checkout.api';
import type { CreateGuestCheckoutQuoteFromCartRequest } from '~/domains/checkout/api/contracts/checkout.contract';

export function useCreateGuestCheckoutQuoteFromCart() {
  return useMutation({
    mutationFn: (body: CreateGuestCheckoutQuoteFromCartRequest) => {
      return checkoutApi.createQuoteFromCart(body);
    },
  });
}
