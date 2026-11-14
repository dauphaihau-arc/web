import type { Category } from '@arc/models/category';
import { normalizeCategory } from '../utils/category.normalizer';
import { categoryApi } from '~/domains/category/api/category.api';
import type { GetCategoriesRequest as GetCategoriesParams } from '~/domains/category/api/contracts/category.contract';

export function useGetCategories(
  params?: MaybeRefOrGetter<GetCategoriesParams | undefined>,
) {
  return useQuery<Category[]>({
    enabled: computed(() => !!toValue(params)),
    queryKey: computed(() => ['get-categories', toValue(params)]),
    queryFn: async () => {
      const response = await categoryApi.getCategories(toValue(params));

      return response.map(normalizeCategory);
    },
  });
}

export async function fetchRootCategories(options?: {
  signal?: AbortSignal
  retryOnWakeUp?: boolean
}): Promise<Category[]> {
  const response = await categoryApi.getCategories(
    undefined,
    { signal: options?.signal },
    { retryOnWakeUp: options?.retryOnWakeUp },
  );

  return response.map(normalizeCategory);
}

export const rootCategoriesQueryOptions = {
  queryKey: ['get-root-categories'],
  // Market switches still refetch: `invalidateMarketSensitiveQueries` lists this
  // key. The stale window only stops the post-hydration refetch of data the SSR
  // payload already carries.
  staleTime: 5 * 60_000,
  queryFn: () => fetchRootCategories(),
} as const;

export function useGetRootCategories() {
  return useQuery<Category[]>({
    ...rootCategoriesQueryOptions,
  });
}
