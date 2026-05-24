import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { checkoutApi } from '~/shared/api/checkout/checkout.api';
import type { GetCheckoutOrderShopsBySessionResponse } from '~/shared/api/checkout/contracts/checkout.contract';

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
