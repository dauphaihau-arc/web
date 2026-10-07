import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { toValue, type MaybeRefOrGetter } from 'vue';
import { MARKET_CONFIG } from '@arc/enums/market';
import { productApi } from '~/domains/product/api/product.api';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

export function useGetDetailProductBySlug(
  shopSlug: string,
  productSlug: string,
  options?: NitroFetchOptions<NitroFetchRequest>,
  enabled?: MaybeRefOrGetter<boolean>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery({
    enabled: computed(() =>
      !!shopSlug && !!productSlug && (enabled === undefined || toValue(enabled))),
    queryKey: computed(() => ['get-detail-product-by-slug', shopSlug, productSlug, marketContext.value]),
    queryFn: () => {
      return productApi.getDetailBySlug(shopSlug, productSlug, options) as Promise<GetDetailProductBySlugResponse>;
    },
  });
}
