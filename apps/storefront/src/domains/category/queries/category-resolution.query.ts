import type { UseQueryOptions } from '@tanstack/vue-query';
import { categoryIdentityQueryPolicy } from '@arc/lib';
import { categoryApi } from '../api/category.api';
import { normalizeCategoryResolution } from '../utils/category.normalizer';
import type { CategoryResolution } from '../utils/category.normalizer';

/**
 * Shared query key/options for authoritative category resolution. The category
 * route middleware prefetches through these options during SSR; the page reads
 * the same cache entry so products and facets only start after resolution.
 */
export function categoryResolutionQueryOptions(publicId: string) {
  return {
    queryKey: ['get-category-resolution', publicId] as const,
    queryFn: async () => normalizeCategoryResolution(
      await categoryApi.resolve(publicId),
    ),
    staleTime: 0,
    // Resolution is terminal: a 404 is a real not-found, and any other failure
    // is surfaced as an error page instead of being retried behind a skeleton.
    ...categoryIdentityQueryPolicy(),
    retry: false,
  };
}

export function useResolvedCategory(
  publicId: MaybeRefOrGetter<string | undefined>,
  options?: Partial<UseQueryOptions<CategoryResolution>>,
) {
  return useQuery<CategoryResolution>({
    ...categoryResolutionQueryOptions(toValue(publicId) ?? ''),
    ...options,
    enabled: computed(() => !!toValue(publicId)),
    queryKey: computed(() => ['get-category-resolution', toValue(publicId) ?? ''] as const),
    // Dereference the live id so the fetch always matches the reactive key. The
    // spread options above pin whatever id existed when the composable ran, and
    // a client-side param change would otherwise refetch the previous category
    // into the new cache entry.
    queryFn: async () => normalizeCategoryResolution(
      await categoryApi.resolve(toValue(publicId) ?? ''),
    ),
  });
}
