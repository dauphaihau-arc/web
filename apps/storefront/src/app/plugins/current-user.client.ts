import { currentUserQueryOptions, hasStoredSession } from '~/shared/server-state/me/current-user.query';

export default defineNuxtPlugin(() => {
  if (!hasStoredSession()) {
    return;
  }

  const queryClient = useQueryClient();
  queryClient.prefetchQuery(currentUserQueryOptions);
});
