import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { checkoutApi } from '~/domains/checkout/api/checkout.api';
import type { GetCheckoutOrderShopsBySessionResponse } from '~/domains/checkout/api/contracts/checkout.contract';

export function useGetCheckoutOrderShopsByCheckoutSession(
  sessionId?: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: ['guest-checkout-session', sessionId],
    queryFn: () => {
      return checkoutApi.getShopsByCheckoutSession(
        sessionId!,
        options
      ) as Promise<GetCheckoutOrderShopsBySessionResponse>;
    },
  });
}
