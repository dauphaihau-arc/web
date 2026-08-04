import { routePaths, routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasAdminRole } from '~/domains/auth/utils/seller-access';

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { data } = useGetCurrentUser();

  if (hasAdminRole(data.value?.user)) {
    return navigateTo(routes.home());
  }

  if (data.value?.user && to.path === routePaths.reset) {
    return navigateTo(routes.home());
  }
});
