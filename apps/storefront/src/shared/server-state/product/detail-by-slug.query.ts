import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { MARKET_CONFIG } from '@arc/enums/market';
import { productApi } from '~/shared/api/product/product.api';
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract';

export function useGetDetailProductBySlug(
  shopSlug: string,
  productSlug: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.guestPreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.guestPreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.guestPreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery({
    enabled: !!shopSlug && !!productSlug,
    queryKey: computed(() => ['get-detail-product-by-slug', shopSlug, productSlug, marketContext.value]),
    queryFn: () => {
      return productApi.getDetailBySlug(shopSlug, productSlug, options) as Promise<GetDetailProductBySlugResponse>;
    },
  });
}
