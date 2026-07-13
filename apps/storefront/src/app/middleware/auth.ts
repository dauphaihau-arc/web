import { isBackendWakeUpError } from '@arc/lib';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';

export default defineNuxtRouteMiddleware(async () => {
  const { data, refetch } = useGetCurrentUser();

  if (data.value?.user) {
    return;
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
