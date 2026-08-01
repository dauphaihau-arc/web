import { currentUserQueryOptions } from '~/domains/me/queries/current-user.query';

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient();
  void queryClient.prefetchQuery(currentUserQueryOptions).catch(() => {});
});
