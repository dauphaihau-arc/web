import { carrierApi } from '~/domains/shop/api/carrier/carrier.api';
import type { CarrierCatalogueResponse } from '~/domains/shop/api/carrier/contracts/carrier.contract';

export const CARRIERS_QUERY_KEY = 'carriers';

/** The catalogue is code-defined, so it stays fresh for the whole session. */
export function useCarriers() {
  return useQuery<CarrierCatalogueResponse>({
    queryKey: [CARRIERS_QUERY_KEY],
    queryFn: () => carrierApi.list(),
    staleTime: Infinity,
  });
}
