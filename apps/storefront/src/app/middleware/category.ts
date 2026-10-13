import { getStatusCode, isCategoryIdentityMismatchError, log } from '@arc/lib';
import { categoryResolutionQueryOptions } from '~/domains/category/queries/category-resolution.query';
import { legacyPathResolutionQueryOptions } from '~/domains/category/queries/legacy-path-resolution.query';
import { categoryRedirectTarget } from '~/domains/category/utils/category-canonical-redirect';
import type { CategoryResolution } from '~/domains/category/utils/category.normalizer';
import {
  CATEGORY_LEGACY_ROUTE_PARAM,
  CATEGORY_ROUTE_PARAM,
  parseCategorySegment,
  routePaths,
} from '~/shared/navigation/route-paths';

/**
 * Resolve a category URL before the category page renders, then canonicalize it.
 *
 * A flat `/c/:slug-c:publicId` segment resolves by permanent public identity; a
 * legacy hierarchical path (e.g. `/c/home/gaming-laptops`) resolves by its
 * permanently bound owner. Either way the response carries the current slug and
 * canonical path, so a wrong slug, a trailing slash, or a legacy path is
 * corrected in one redirect that preserves the query — HTTP 301 on a direct
 * request, an in-place route replacement during client navigation.
 *
 * On the server a malformed, unknown, or unowned path answers with a genuine
 * 404 and no listing/facet request is issued; a backend failure stays an error.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const identity = parseCategorySegment(to.params[CATEGORY_ROUTE_PARAM]);
  const legacyPath = identity ? undefined : legacyPathOf(to);

  log.debug('Category route resolution', {
    runtime: import.meta.server ? 'server' : 'client',
    path: to.path,
    publicId: identity?.publicId,
    legacyPath,
  });

  const queryClient = useQueryClient();
  let resolveRequest: (() => Promise<CategoryResolution>) | undefined;

  if (identity) {
    resolveRequest = () => queryClient.fetchQuery(categoryResolutionQueryOptions(identity.publicId));
  }
  else if (legacyPath) {
    resolveRequest = () => queryClient.fetchQuery(legacyPathResolutionQueryOptions(legacyPath));
  }

  if (!resolveRequest) {
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
  }

  let resolution: CategoryResolution;

  try {
    resolution = await resolveRequest();
  }
  catch (error) {
    const status = getStatusCode(error);

    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
    }

    // An outdated client/backend identity contract is not a missing category:
    // let the page render so the scoped update card can take over.
    if (isCategoryIdentityMismatchError(error) || status === 409) {
      return;
    }

    throw createError({ statusCode: 500, statusMessage: 'Something went wrong' });
  }

  const target = categoryRedirectTarget(resolution, to);

  if (target) {
    return navigateTo(target, { redirectCode: 301, replace: true });
  }
});

/**
 * The legacy path for the current route, or undefined when the route carries no
 * path segments. The catch-all route exposes its segments as an array; a
 * single-segment flat route that failed to parse is a single legacy segment.
 */
function legacyPathOf(to: { params: Record<string, string | string[]> }): string | undefined {
  const segments = to.params[CATEGORY_LEGACY_ROUTE_PARAM];

  if (Array.isArray(segments) && segments.length > 0) {
    return `${routePaths.category}/${segments.map(String).join('/')}`;
  }

  const single = to.params[CATEGORY_ROUTE_PARAM];

  if (typeof single === 'string' && single.length > 0) {
    return `${routePaths.category}/${single}`;
  }

  return undefined;
}
