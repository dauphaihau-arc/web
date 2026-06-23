import { currentUserQueryOptions } from '~/shared/server-state/me/current-user.query';

export default defineNuxtPlugin(async () => {
  const queryClient = useQueryClient();

  if (import.meta.client) {
    await queryClient.fetchQuery({
      ...currentUserQueryOptions,
      staleTime: 0,
    }).catch(() => {});
  }
  else {
    await queryClient.prefetchQuery(currentUserQueryOptions).catch(() => {});
  }

  const marketStore = useMarketStore();
  await marketStore.ensureMarketReady().catch(() => {});
});
