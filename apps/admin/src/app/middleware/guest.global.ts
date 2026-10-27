import { routePaths, routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasAdminRole } from '~/domains/auth/utils/admin-access';

// Routes whose guard outcome depends on knowing the session; the server has no
// query cache on a fresh request, so it must be resolved before deciding.
const sessionDependentPaths: string[] = [
  routePaths.login,
];

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const queryClient = useQueryClient();
  const { data, refetch } = useGetCurrentUser();

  // `undefined` means the session was never resolved; a resolved guest is
  // `{ user: null }` and needs no second API call. On the server the session is
  // resolved here, on the client this joins the in-flight request.
  if (sessionDependentPaths.includes(to.path) && data.value === undefined) {
    await refetch({ throwOnError: true }).catch(() => undefined);
  }

  // A session from another portal is not an admin session. Do not call
  // `/auth/logout` here: cookies are host-scoped, not port-scoped, so in local
  // development a seller session can share this host's jar, and logging it out
  // would destroy the other portal's session. Drop only this app's cached user.
  if (data.value?.user && !hasAdminRole(data.value.user)) {
    queryClient.setQueryData(['current-user'], { user: null });

    if (to.path !== routePaths.login) {
      return navigateTo(routes.login());
    }
    return;
  }

  if (hasAdminRole(data.value?.user) && to.path === routePaths.login) {
    return navigateTo(routes.shops());
  }
});
