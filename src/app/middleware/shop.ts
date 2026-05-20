import { isBackendWakeUpError } from '~/shared/composables/use-backend-status';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';

export default defineNuxtRouteMiddleware(async () => {
  const { data: dataUserAuth, refetch } = useGetCurrentUser();

  if (dataUserAuth.value?.user?.shop) {
    return navigateTo(routes.accountShopProducts());
  }

  if (dataUserAuth.value?.user && !dataUserAuth.value.user.shop) {
    try {
      const response = await refetch({ throwOnError: true });

      if (response.data?.user?.shop) {
        return navigateTo(routes.accountShopProducts());
      }

      return;
    }
    catch (error) {
      if (isBackendWakeUpError(error)) {
        void refetch();
      }

      return;
    }
  }
});
