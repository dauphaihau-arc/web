import { meCheckoutApi } from '~/domains/me/api/checkout/me-checkout.api';
import type { CreateOrderForBuyNowRequest } from '~/domains/me/api/order/contracts/order.contract';

export function useCreateOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateOrderForBuyNowRequest) => {
      return meCheckoutApi.createForBuyNow(body);
    },
  });
}
