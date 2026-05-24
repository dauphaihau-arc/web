import { checkoutApi } from '~/shared/api/checkout/checkout.api';
import type { CreateGuestOrderForBuyNowRequest } from '~/shared/api/checkout/contracts/checkout.contract';

export function useCreateGuestOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateGuestOrderForBuyNowRequest) => {
      return checkoutApi.createForBuyNow(body);
    },
  });
}
