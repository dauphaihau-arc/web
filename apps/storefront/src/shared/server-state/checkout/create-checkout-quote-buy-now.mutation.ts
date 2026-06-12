import { checkoutApi } from '~/shared/api/checkout/checkout.api';
import type { CreateGuestCheckoutQuoteForBuyNowRequest } from '~/shared/api/checkout/contracts/checkout.contract';

export function useCreateGuestCheckoutQuoteForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateGuestCheckoutQuoteForBuyNowRequest) => {
      return checkoutApi.createQuoteForBuyNow(body);
    },
  });
}
