import { isBackendWakeUpError } from '@arc/lib';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';

export default defineNuxtRouteMiddleware(async () => {
  const { data: dataUserAuth, refetch } = useGetCurrentUser();

  if (dataUserAuth.value?.user?.shop) {
    return;
  }

  if (dataUserAuth.value?.user && !dataUserAuth.value.user.shop) {
    try {
      const response = await refetch({ throwOnError: true });

      if (response.data?.user?.shop) {
        return;
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
