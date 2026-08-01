import { meCheckoutApi } from '~/domains/me/api/checkout/me-checkout.api';
import type { CreateCheckoutQuoteFromCartRequest } from '~/domains/me/api/order/contracts/order.contract';

export function useCreateCheckoutQuoteFromCart() {
  return useMutation({
    mutationFn: (body: CreateCheckoutQuoteFromCartRequest) => {
      return meCheckoutApi.createQuoteFromCart(body);
    },
  });
}
