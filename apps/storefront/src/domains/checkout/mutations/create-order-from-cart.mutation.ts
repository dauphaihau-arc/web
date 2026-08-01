import { checkoutApi } from '~/domains/checkout/api/checkout.api';
import type { CreateGuestOrderFromCartRequest } from '~/domains/checkout/api/contracts/checkout.contract';

export function useCreateGuestOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateGuestOrderFromCartRequest) => {
      return checkoutApi.createFromCart(body);
    },
  });
}
