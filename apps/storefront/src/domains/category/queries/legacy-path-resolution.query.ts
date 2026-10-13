import { categoryIdentityQueryPolicy } from '@arc/lib';
import { categoryApi } from '../api/category.api';
import { normalizeCategoryResolution } from '../utils/category.normalizer';

/**
 * Authoritative resolution for a legacy hierarchical category path. Mirrors the
 * flat category resolution query: the path owner is fixed, but the returned
 * slug is the current one, so the caller can canonicalize in one redirect.
 */
export function legacyPathResolutionQueryOptions(legacyPath: string) {
  return {
    queryKey: ['get-category-legacy-path-resolution', legacyPath] as const,
    queryFn: async () => normalizeCategoryResolution(
      await categoryApi.resolveLegacyPath(legacyPath),
    ),
    staleTime: 0,
    // Resolution is terminal: a 404 is a real not-found, and any other failure
    // is surfaced as an error page instead of being retried behind a skeleton.
    ...categoryIdentityQueryPolicy(),
    retry: false,
  };
}
