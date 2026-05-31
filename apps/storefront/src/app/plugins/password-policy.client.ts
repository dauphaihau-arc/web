import { authClientConfigQueryOptions } from '~/shared/server-state/auth/client-config.query'

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient()
  void queryClient.prefetchQuery(authClientConfigQueryOptions).catch(() => {})
})
