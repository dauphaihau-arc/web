import { isBackendWakeUpError } from '@arc/lib';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasCustomerAccess } from '~/domains/auth/utils/seller-access';

export default defineNuxtRouteMiddleware(async () => {
  const { data, refetch } = useGetCurrentUser();

  if (hasCustomerAccess(data.value?.user)) {
    return;
  }

  if (data.value?.user) {
    return navigateTo(routes.home());
  }

  try {
    const response = await refetch({ throwOnError: true });

    if (!hasCustomerAccess(response.data?.user)) {
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
