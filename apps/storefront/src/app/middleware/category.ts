import { getStatusCode, isCategoryIdentityMismatchError, log } from '@arc/lib';
import { categoryResolutionQueryOptions } from '~/domains/category/queries/category-resolution.query';
import { CATEGORY_ROUTE_PARAM, parseCategorySegment } from '~/shared/navigation/route-paths';

/**
 * Resolve a flat category URL before the category page renders.
 *
 * On the server this runs during SSR, so a malformed, unknown, or unavailable
 * identity answers with a genuine 404 and no listing/facet request is issued.
 * On the client it runs on every category navigation, keeping route transitions
 * reactive without relying on session breadcrumbs.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const identity = parseCategorySegment(to.params[CATEGORY_ROUTE_PARAM]);

  if (!identity) {
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
  }

  log.debug('Category route resolution', {
    runtime: import.meta.server ? 'server' : 'client',
    path: to.path,
    publicId: identity.publicId,
  });

  const queryClient = useQueryClient();

  try {
    await queryClient.fetchQuery(categoryResolutionQueryOptions(identity.publicId));
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
});
