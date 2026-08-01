import { checkoutApi } from '~/domains/checkout/api/checkout.api';
import type { CreateGuestCheckoutQuoteForBuyNowRequest } from '~/domains/checkout/api/contracts/checkout.contract';

export function useCreateGuestCheckoutQuoteForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateGuestCheckoutQuoteForBuyNowRequest) => {
      return checkoutApi.createQuoteForBuyNow(body);
    },
  });
}
