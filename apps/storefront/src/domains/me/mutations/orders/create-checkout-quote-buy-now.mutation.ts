import { meCheckoutApi } from '~/domains/me/api/checkout/me-checkout.api';
import type { CreateCheckoutQuoteForBuyNowRequest } from '~/domains/me/api/order/contracts/order.contract';

export function useCreateCheckoutQuoteForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateCheckoutQuoteForBuyNowRequest) => {
      return meCheckoutApi.createQuoteForBuyNow(body);
    },
  });
}
