import { log } from '@arc/lib';
import { currentUserQueryOptions } from '~/domains/me/queries/current-user.query';

export default defineNuxtPlugin(async () => {
  const queryClient = useQueryClient();

  // in the browser, revalidate the session without blocking browser starup
  // staleTime: 0 forces a fresh check of the user hydrated from SSR
  if (import.meta.client) {
    void queryClient.fetchQuery({
      ...currentUserQueryOptions,
      staleTime: 0,
    }).catch(() => {});
    return;
  }

  const { markReady } = useBackendStatus();

  // Every server request starts with an empty query cache, so the session is
  // resolved here and dehydrated into the payload the client hydrates from.
  // A settled probe also means the API answered, so the shell can render the
  // page instead of holding the client-only wake-up splash.
  log.info('[current-user][SSR] prefetch start');
  await queryClient.prefetchQuery(currentUserQueryOptions)
    .then(() => markReady())
    .catch(() => undefined);
});
