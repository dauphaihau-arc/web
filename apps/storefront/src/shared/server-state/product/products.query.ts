import type { UseQueryOptions } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import { MARKET_CONFIG } from '@arc/enums/market';
import { productApi } from '~/shared/api/product/product.api';
import type {
  GetProductSuggestionsResponse,
  GetProductsRequest,
  GetProductsResponse
} from '~/shared/api/product/contracts/product.contract';

export function useGetProducts(
  params: ComputedRef<GetProductsRequest | undefined>,
  options?: Partial<UseQueryOptions<GetProductsResponse>>
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.guestPreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.guestPreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.guestPreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductsResponse>({
    enabled: computed(() => !!params.value && marketStore.isMarketReady),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
    queryKey: computed(() => ['get-products', params.value, marketContext.value]),
    queryFn: () => {
      return productApi.getList(params.value) as Promise<GetProductsResponse>;
    },
  });
}

export function useGetProductSuggestions(
  params: ComputedRef<{ search: string, limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductSuggestionsResponse>>
) {
  return useQuery<GetProductSuggestionsResponse>({
    enabled: computed(() => !!params.value),
    ...options,
    queryKey: computed(() => ['get-product-suggestions', params.value]),
    queryFn: () => productApi.getSuggestions(
      params.value?.search ?? '',
      params.value?.limit
    ) as Promise<GetProductSuggestionsResponse>,
  });
}

export function useGetProductsByMultiQueries(queries?: GetProductsRequest[]) {
  return useQueries({
    queries: queries?.map(qp => ({
      queryKey: [qp.category_id],
      queryFn: async () => {
        const res = await productApi.getList(qp) as GetProductsResponse;
        return {
          ...res,
          category_id: qp.category_id,
        };
      },
    })) ?? [],
  });
}
