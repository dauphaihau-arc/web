import { isBackendWakeUpError } from '@arc/lib';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';
import { setPostAuthRedirect } from '~/shared/server-state/auth/post-auth-redirect';
import { clearExpTokensInLS } from '~/shared/server-state/auth/token-storage';
import { hasSellerAccess } from '~/shared/utils/seller-access';

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
    clearExpTokensInLS();
    setPostAuthRedirect(to.fullPath);
    return navigateTo(routes.login());
  }

  try {
    const response = await refetch({ throwOnError: true });

    if (!hasSellerAccess(response.data?.user)) {
      queryClient.setQueryData(['current-user'], { user: null });
      clearExpTokensInLS();
      setPostAuthRedirect(to.fullPath);
      return navigateTo(routes.login());
    }
  }
  catch (error) {
    if (isBackendWakeUpError(error)) {
      void refetch();
      return;
    }

    setPostAuthRedirect(to.fullPath);
    return navigateTo(routes.login());
  }
});
