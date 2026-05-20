import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/shared/server-state/user';
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status';

export default defineNuxtRouteMiddleware(async () => {
  const { data, refetch } = useGetCurrentUser();

  if (data.value?.user) {
    return;
  }

  const hasAccessToken = !!localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP];

  if (!hasAccessToken) {
    return navigateTo(routes.home());
  }

  try {
    const response = await refetch({ throwOnError: true });

    if (!response.data?.user) {
      return navigateTo(routes.home());
    }
  }
  catch (error) {
    if (isBackendWakeUpError(error)) {
      void refetch();
      return;
    }

    return navigateTo(routes.home());
  }
});
