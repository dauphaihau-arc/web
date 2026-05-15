import { ROUTES } from '~/shared/config/enums/routes';
import { LOCAL_STORAGE_KEYS } from '~/shared/config/enums/local-storage-keys';
import { useGetCurrentUser } from '~/shared/services/user';
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status';

export default defineNuxtRouteMiddleware(async () => {
  const { data, refetch } = useGetCurrentUser();

  if (data.value?.user) {
    return;
  }

  const hasAccessToken = !!localStorage[LOCAL_STORAGE_KEYS.ACCESS_TOKEN_EXP];

  if (!hasAccessToken) {
    return navigateTo(ROUTES.HOME);
  }

  try {
    const response = await refetch({ throwOnError: true });

    if (!response.data?.user) {
      return navigateTo(ROUTES.HOME);
    }
  }
  catch (error) {
    if (isBackendWakeUpError(error)) {
      void refetch();
      return;
    }

    return navigateTo(ROUTES.HOME);
  }
});
