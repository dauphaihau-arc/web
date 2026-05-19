import { ROUTES } from '~/shared/config/enums/routes';
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status';
import { useGetCurrentUser } from '~/shared/server-state/user';

export default defineNuxtRouteMiddleware(async () => {
  const { data: dataUserAuth, refetch } = useGetCurrentUser();

  if (dataUserAuth.value?.user?.shop) {
    return navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}`);
  }

  if (dataUserAuth.value?.user && !dataUserAuth.value.user.shop) {
    try {
      const response = await refetch({ throwOnError: true });

      if (response.data?.user?.shop) {
        return navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}`);
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
