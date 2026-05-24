import { currentUserQueryOptions } from '~/shared/server-state/me/current-user.query'

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient()
  queryClient.prefetchQuery(currentUserQueryOptions)
})
