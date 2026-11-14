import type { QueryClient, UseQueryOptions } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import { MARKET_CONFIG } from '@arc/enums/market';
import { categoryIdentityQueryPolicy } from '@arc/lib';
import { productApi } from '~/domains/product/api/product.api';
import type {
  GetProductFacetsResponse,
  GetProductRecommendationSectionsResponse,
  GetProductRecommendationsResponse,
  GetProductSuggestionsResponse,
  GetProductsRequest,
  GetProductsResponse,
  RecordProductViewResponse,
} from '~/domains/product/api/contracts/product.contract';

export function useGetProducts(
  params: ComputedRef<GetProductsRequest | undefined>,
  options?: Partial<UseQueryOptions<GetProductsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductsResponse>({
    enabled: computed(() => !!params.value && marketStore.isMarketReady),
    staleTime: 0,
    ...options,
    ...categoryIdentityQueryPolicy(),
    queryKey: computed(() => ['get-products', params.value, marketContext.value]),
    queryFn: () => {
      return productApi.getList(params.value) as Promise<GetProductsResponse>;
    },
  });
}

export function useGetProductSuggestions(
  params: ComputedRef<{ search: string, limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductSuggestionsResponse>>,
) {
  return useQuery<GetProductSuggestionsResponse>({
    enabled: computed(() => !!params.value),
    ...options,
    queryKey: computed(() => ['get-product-suggestions', params.value]),
    queryFn: () => productApi.getSuggestions(
      params.value?.search ?? '',
      params.value?.limit,
    ) as Promise<GetProductSuggestionsResponse>,
  });
}

export function useGetProductRecommendations(
  params: ComputedRef<{ shopSlug: string, productSlug: string, limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductRecommendationsResponse>({
    enabled: computed(() =>
      !!params.value?.shopSlug
      && !!params.value?.productSlug
      && marketStore.isMarketReady,
    ),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
    queryKey: computed(() => ['get-product-recommendations', params.value, marketContext.value]),
    queryFn: () => productApi.getRecommendations(
      params.value?.shopSlug ?? '',
      params.value?.productSlug ?? '',
      params.value?.limit,
    ) as Promise<GetProductRecommendationsResponse>,
  });
}

export function useGetProductRecommendationSections(
  params: ComputedRef<{ shopSlug: string, productSlug: string, limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductRecommendationSectionsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductRecommendationSectionsResponse>({
    enabled: computed(() =>
      !!params.value?.shopSlug
      && !!params.value?.productSlug
      && marketStore.isMarketReady,
    ),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
    queryKey: computed(() => ['get-product-recommendation-sections', params.value, marketContext.value]),
    queryFn: () => productApi.getRecommendationSections(
      params.value?.shopSlug ?? '',
      params.value?.productSlug ?? '',
      params.value?.limit,
    ) as Promise<GetProductRecommendationSectionsResponse>,
  });
}

export function useGetRecentlyViewedProducts(
  params: ComputedRef<{ limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductRecommendationsResponse>({
    enabled: computed(() => marketStore.isMarketReady),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
    queryKey: computed(() => ['get-recently-viewed-products', params.value, marketContext.value]),
    queryFn: () => productApi.getRecentlyViewed(params.value?.limit) as Promise<GetProductRecommendationsResponse>,
  });
}

/**
 * Values that identify the priced product view. Kept as plain strings because
 * the guest/user preference unions and the `MARKET_CONFIG` fallbacks use
 * different literal types for the same values.
 */
export type ProductMarketContext = {
  currency: string
  language: string
  region: string
};

export function useProductMarketContext() {
  const marketStore = useMarketStore();

  return computed((): ProductMarketContext => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));
}

export function trendingProductsQueryKey(
  params: { limit?: number } | undefined,
  market: ProductMarketContext,
) {
  return ['get-trending-products', params, market] as const;
}

/**
 * SSR prefetch for the first home rail. The server already resolves the market
 * context in the current-user plugin, so the rendered HTML can carry the card
 * images instead of waiting for hydration, a client API round trip, and image
 * discovery. Must stay in sync with `useGetTrendingProducts` via
 * `trendingProductsQueryKey`.
 */
export function prefetchTrendingProducts(queryClient: QueryClient, limit: number) {
  return queryClient.prefetchQuery({
    queryKey: trendingProductsQueryKey({ limit }, useProductMarketContext().value),
    queryFn: () => productApi.getTrending(limit) as Promise<GetProductRecommendationsResponse>,
  });
}

export function useGetTrendingProducts(
  params: ComputedRef<{ limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = useProductMarketContext();

  return useQuery<GetProductRecommendationsResponse>({
    enabled: computed(() => marketStore.isMarketReady),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
    queryKey: computed(() => trendingProductsQueryKey(params.value, marketContext.value)),
    queryFn: () => productApi.getTrending(params.value?.limit) as Promise<GetProductRecommendationsResponse>,
  });
}

export function useGetBestSellerProducts(
  params: ComputedRef<{ limit?: number } | undefined>,
  options?: Partial<UseQueryOptions<GetProductRecommendationsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductRecommendationsResponse>({
    enabled: computed(() => marketStore.isMarketReady),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
    queryKey: computed(() => ['get-best-seller-products', params.value, marketContext.value]),
    queryFn: () => productApi.getBestSellers(params.value?.limit) as Promise<GetProductRecommendationsResponse>,
  });
}

export function useRecordProductView() {
  const queryClient = useQueryClient();

  return useMutation<RecordProductViewResponse, Error, { shopSlug: string, productSlug: string }>({
    mutationFn: ({ shopSlug, productSlug }) => productApi.recordView(shopSlug, productSlug) as Promise<RecordProductViewResponse>,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['get-recently-viewed-products'],
      });
    },
  });
}

export function useGetProductFacets(
  params: ComputedRef<GetProductsRequest | undefined>,
  options?: Partial<UseQueryOptions<GetProductFacetsResponse>>,
) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQuery<GetProductFacetsResponse>({
    enabled: computed(() => !!params.value && marketStore.isMarketReady),
    staleTime: 0,
    ...options,
    ...categoryIdentityQueryPolicy(),
    queryKey: computed(() => ['get-product-facets', params.value, marketContext.value]),
    queryFn: () => productApi.getFacets(params.value) as Promise<GetProductFacetsResponse>,
  });
}

export function useGetProductsByMultiQueries(queries?: GetProductsRequest[]) {
  const marketStore = useMarketStore();
  const marketContext = computed(() => ({
    currency: marketStore.activePreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY,
    language: marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE,
    region: marketStore.activePreferences?.region ?? MARKET_CONFIG.BASE_REGION,
  }));

  return useQueries({
    queries: queries?.map(qp => ({
      ...categoryIdentityQueryPolicy(),
      queryKey: ['get-products', qp, marketContext.value],
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
