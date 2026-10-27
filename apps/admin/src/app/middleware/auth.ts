import { isBackendWakeUpError } from '@arc/lib';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { hasAdminRole } from '~/domains/auth/utils/admin-access';

export default defineNuxtRouteMiddleware(async (to) => {
  const queryClient = useQueryClient();
  const { data, refetch } = useGetCurrentUser();

  if (hasAdminRole(data.value?.user)) {
    return;
  }

  if (data.value?.user) {
    try {
      const response = await refetch({ throwOnError: true });

      if (hasAdminRole(response.data?.user)) {
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

    if (!hasAdminRole(response.data?.user)) {
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
