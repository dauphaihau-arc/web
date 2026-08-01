import { checkoutApi } from '~/domains/checkout/api/checkout.api';
import type { CreateGuestOrderForBuyNowRequest } from '~/domains/checkout/api/contracts/checkout.contract';

export function useCreateGuestOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateGuestOrderForBuyNowRequest) => {
      return checkoutApi.createForBuyNow(body);
    },
  });
}
