import { meCheckoutApi } from '~/shared/api/me/checkout/me-checkout.api';
import type { CreateCheckoutQuoteFromCartRequest } from '~/shared/api/me/order/contracts/order.contract';

export function useCreateCheckoutQuoteFromCart() {
  return useMutation({
    mutationFn: (body: CreateCheckoutQuoteFromCartRequest) => {
      return meCheckoutApi.createQuoteFromCart(body);
    },
  });
}
