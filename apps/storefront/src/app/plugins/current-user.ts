import { currentUserQueryOptions } from '~/shared/server-state/me/current-user.query';

export default defineNuxtPlugin(async () => {
  const queryClient = useQueryClient();
  const marketStore = useMarketStore();

  if (import.meta.client) {
    void queryClient.fetchQuery({
      ...currentUserQueryOptions,
      staleTime: 0,
    }).catch(() => {});
    void marketStore.ensureMarketReady().catch(() => {});
  }
  else {
    await queryClient.prefetchQuery(currentUserQueryOptions).catch(() => {});
    await marketStore.ensureMarketReady().catch(() => {});
  }
});
