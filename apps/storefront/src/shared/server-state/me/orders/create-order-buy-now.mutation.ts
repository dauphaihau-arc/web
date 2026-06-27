import { meCheckoutApi } from '~/shared/api/me/checkout/me-checkout.api';
import type { CreateOrderForBuyNowRequest } from '~/shared/api/me/order/contracts/order.contract';

export function useCreateOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateOrderForBuyNowRequest) => {
      return meCheckoutApi.createForBuyNow(body);
    },
  });
}
