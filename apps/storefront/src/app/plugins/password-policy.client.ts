import { authClientConfigQueryOptions } from '~/domains/auth/queries/client-config.query';

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient();
  void queryClient.query(authClientConfigQueryOptions).catch(() => {});
});
