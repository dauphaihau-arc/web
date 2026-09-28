import { isBackendWakeUpError } from '@arc/lib';
import { routes } from '~/shared/navigation/routes';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';

// Guard for the create-shop onboarding route. Any signed-in user without a shop
// belongs here; the guest global middleware has already logged admins out and
// sent sellers with a shop to their workspace.
export default defineNuxtRouteMiddleware(async (to) => {
  const { data, refetch } = useGetCurrentUser();

  // `undefined` means the session was never resolved (the global middleware
  // swallows a failed probe). A resolved guest is `{ user: null }` and goes
  // straight to the login redirect without another session request.
  if (data.value === undefined) {
    try {
      await refetch({ throwOnError: true });
    }
    catch (error) {
      if (isBackendWakeUpError(error)) {
        void refetch();
        return;
      }
    }
  }

  if (data.value?.user) {
    return;
  }

  return navigateTo(routes.login({ redirect: to.fullPath }));
});
