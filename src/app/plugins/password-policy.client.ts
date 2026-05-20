import { authClientConfigQueryOptions } from '~/shared/server-state/auth';

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient();
  queryClient.prefetchQuery(authClientConfigQueryOptions);
});
