import { log } from '@arc/lib';
import { authClientConfigQueryOptions } from '~/domains/auth/queries/client-config.query';

export default defineNuxtPlugin(async () => {
  const queryClient = useQueryClient();

  // in the browser, warm the query cache without blocking app startup
  if (import.meta.client) {
    void queryClient.prefetchQuery(authClientConfigQueryOptions).catch(() => {});
    return;
  }

  // The password policy is read while rendering the auth pages, so the server has
  // to resolve it before rendering; otherwise the button that reflects its loading
  // state is server-rendered disabled and hydration keeps that attribute.
  log.info('[auth-client-config][SSR] prefetch start');
  await queryClient.prefetchQuery(authClientConfigQueryOptions).catch(() => {});
});
