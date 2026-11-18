import { routePaths, routes } from '~/shared/navigation/routes';
import { useLocalizedRoute } from '~/shared/composables/use-localized-route';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasAdminRole } from '~/domains/auth/utils/seller-access';

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { localizePath } = useLocalizedRoute();
  const home = localizePath(routes.home());
  const resetPath = localizePath(routePaths.reset);
  const { data } = useGetCurrentUser();

  if (hasAdminRole(data.value?.user)) {
    return navigateTo(home);
  }

  if (data.value?.user && to.path === resetPath) {
    return navigateTo(home);
  }
});
