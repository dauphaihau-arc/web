import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { checkoutApi } from '~/shared/api/checkout/checkout.api';
import type {
  GetGuestOrderLookupRequest,
  GetGuestOrderLookupResponse
} from '~/shared/api/checkout/contracts/guest-orders.contract';

export function useLookupGuestOrders(
  params: MaybeRefOrGetter<GetGuestOrderLookupRequest>,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: false,
    queryKey: ['guest-orders-lookup'],
    queryFn: () => {
      const resolvedParams = toValue(params);
      return checkoutApi.lookupGuestOrders(
        resolvedParams,
        options
      ) as Promise<GetGuestOrderLookupResponse>;
    },
  });
}
