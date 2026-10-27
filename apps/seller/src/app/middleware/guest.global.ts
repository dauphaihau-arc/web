import { routePaths, routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasAdminRole, hasSellerAccess } from '~/domains/auth/utils/seller-access';

// Routes whose guard outcome depends on knowing the session; the server has no
// query cache on a fresh request, so it must be resolved before deciding.
const sessionDependentPaths: string[] = [
  routePaths.login,
  routePaths.register,
  routePaths.reset,
  routePaths.sell,
];

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const queryClient = useQueryClient();
  const { data, refetch } = useGetCurrentUser();

  // `undefined` means the session was never resolved; a resolved guest is
  // `{ user: null }` and needs no second API call. On the server the plugin has
  // already resolved it, on the client this joins the in-flight request.
  if (sessionDependentPaths.includes(to.path) && data.value === undefined) {
    await refetch({ throwOnError: true }).catch(() => undefined);
  }

  if (hasAdminRole(data.value?.user)) {
    // Do not log the admin session out: cookies are host-scoped, not
    // port-scoped, so a development admin session can share this host's jar.
    // Clearing the seller query cache is enough to show the guest surface.
    queryClient.setQueryData(['current-user'], { user: null });

    if (to.path !== routePaths.login) {
      return navigateTo(routes.login());
    }
    return;
  }

  if (data.value?.user && !hasSellerAccess(data.value.user)
    && (to.path === routePaths.login || to.path === routePaths.register)) {
    return navigateTo(routes.sell());
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.reset) {
    return navigateTo(routes.home());
  }

  if (hasSellerAccess(data.value?.user)
    && (to.path === routePaths.login || to.path === routePaths.register || to.path === routePaths.sell)) {
    return navigateTo(routes.dashboard());
  }
});
