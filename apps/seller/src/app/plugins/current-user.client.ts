import { currentUserQueryOptions } from '~/shared/server-state/me/current-user.query';

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient();
  void queryClient.prefetchQuery(currentUserQueryOptions).catch(() => {});
});
