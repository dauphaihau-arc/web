import { isBackendWakeUpError } from '@arc/lib';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasSellerAccess } from '~/domains/auth/utils/seller-access';

export default defineNuxtRouteMiddleware(async (to) => {
  const queryClient = useQueryClient();
  const { data, refetch } = useGetCurrentUser();

  if (hasSellerAccess(data.value?.user)) {
    return;
  }

  if (data.value?.user) {
    try {
      const response = await refetch({ throwOnError: true });

      if (hasSellerAccess(response.data?.user)) {
        return;
      }
    }
    catch (error) {
      if (isBackendWakeUpError(error)) {
        void refetch();
        return;
      }
    }

    queryClient.setQueryData(['current-user'], { user: null });
    return navigateTo(routes.login({ redirect: to.fullPath }));
  }

  try {
    const response = await refetch({ throwOnError: true });

    if (!hasSellerAccess(response.data?.user)) {
      queryClient.setQueryData(['current-user'], { user: null });
      return navigateTo(routes.login({ redirect: to.fullPath }));
    }
  }
  catch (error) {
    if (isBackendWakeUpError(error)) {
      void refetch();
      return;
    }

    return navigateTo(routes.login({ redirect: to.fullPath }));
  }
});
