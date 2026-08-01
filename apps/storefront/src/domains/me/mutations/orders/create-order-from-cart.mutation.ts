import { meCheckoutApi } from '~/domains/me/api/checkout/me-checkout.api';
import type { CreateOrderFromCartRequest } from '~/domains/me/api/order/contracts/order.contract';

export function useCreateOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateOrderFromCartRequest) => {
      return meCheckoutApi.createFromCart(body);
    },
  });
}
