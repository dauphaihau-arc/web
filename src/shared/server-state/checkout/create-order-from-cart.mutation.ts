import { checkoutApi } from '~/shared/api/checkout/checkout.api';
import type { CreateGuestOrderFromCartRequest } from '~/shared/api/checkout/contracts/checkout.contract';

export function useCreateGuestOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateGuestOrderFromCartRequest) => {
      return checkoutApi.createFromCart(body);
    },
  });
}
