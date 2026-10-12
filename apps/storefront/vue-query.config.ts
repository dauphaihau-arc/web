import { applyCategoryIdentityQueryPolicy, type CategoryIdentityQueryClient } from '@arc/lib'

/**
 * Category identity mismatch is terminal for the running app instance, so a
 * category-bearing query must not be retried or automatically refetched while
 * it is blocked. Applied as query-client defaults via the vue-query module's
 * plugin hook; query options that would re-enable retries/refetch spread
 * `categoryIdentityQueryPolicy()` after their own options.
 */
export const pluginHook = (parameters: { queryClient: CategoryIdentityQueryClient }) =>
  applyCategoryIdentityQueryPolicy(parameters)

export default pluginHook
