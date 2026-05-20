import { currentUserQueryOptions, hasStoredSession } from '~/shared/server-state/user';

export default defineNuxtPlugin(() => {
  if (!hasStoredSession()) {
    return;
  }

  const queryClient = useQueryClient();
  queryClient.prefetchQuery(currentUserQueryOptions);
});
