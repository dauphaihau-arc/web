import { isCanonicalCategoryPath } from '~/shared/navigation/route-paths';
import type { CategoryResolution } from './category.normalizer';

export type CategoryRequestLocation = {
  path: string
  fullPath: string
};

/**
 * The one-hop redirect target for a resolved category request, or `null` when
 * the requested URL already is canonical.
 *
 * The canonical URL carries the latest slug and no trailing slash, so a wrong
 * slug and a trailing slash are corrected in a single redirect. The original
 * query (and hash) are preserved, so filters, sorting, and pagination survive
 * the correction.
 */
export function categoryRedirectTarget(
  resolution: CategoryResolution,
  location: CategoryRequestLocation,
): string | null {
  if (isCanonicalCategoryPath(location.path, resolution.canonicalPath)) {
    return null;
  }

  return resolution.canonicalPath + location.fullPath.slice(location.path.length);
}
