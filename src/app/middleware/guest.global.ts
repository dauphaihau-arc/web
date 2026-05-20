import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys';
import { routePaths, routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/shared/server-state/user';

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { refetch, data } = useGetCurrentUser();

  if (!data.value?.user && localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP]) {
    void refetch();
  }

  if (data.value?.user && to.path === routePaths.reset) {
    return navigateTo(routes.home());
  }
});
