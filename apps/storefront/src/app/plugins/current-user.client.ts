import { currentUserQueryOptions } from '~/shared/server-state/me/current-user.query'

export default defineNuxtPlugin(async () => {
  const queryClient = useQueryClient()
  await queryClient.prefetchQuery(currentUserQueryOptions)

  const marketStore = useMarketStore()
  await marketStore.ensureMarketReady()
})
