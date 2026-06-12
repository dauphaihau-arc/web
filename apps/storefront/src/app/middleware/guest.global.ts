import { routePaths, routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { data } = useGetCurrentUser();

  if (data.value?.user && to.path === routePaths.reset) {
    return navigateTo(routes.home());
  }
});
