import { routePaths, routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasAdminRole, hasSellerAccess } from '~/domains/auth/utils/seller-access';
import { clearExpTokensInLS } from '~/domains/auth/utils/token-storage';
import { authApi } from '~/domains/auth/api/auth.api';

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const queryClient = useQueryClient();
  const { refetch, data } = useGetCurrentUser();

  if (!data.value?.user) {
    void refetch();
  }

  if (hasAdminRole(data.value?.user)) {
    await authApi.logout().catch(() => undefined);
    queryClient.setQueryData(['current-user'], { user: null });
    clearExpTokensInLS();

    if (to.path !== routePaths.login) {
      return navigateTo(routes.login());
    }
    return;
  }

  if (data.value?.user && !hasSellerAccess(data.value.user) &&
    (to.path === routePaths.login || to.path === routePaths.register)) {
    return navigateTo(routes.sell());
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.reset) {
    return navigateTo(routes.home());
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.login) {
    return navigateTo(routes.products());
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.register) {
    return navigateTo(routes.products());
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.sell) {
    return navigateTo(routes.products());
  }
});
