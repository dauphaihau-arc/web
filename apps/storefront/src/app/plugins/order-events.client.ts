import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { createOrderEventsClient } from '~/shared/realtime/order-events.client'

export default defineNuxtPlugin(() => {
  const currentUserQuery = useGetCurrentUser()
  const queryClient = useQueryClient()
  const orderEventsClient = createOrderEventsClient(queryClient)

  watch(
    () => currentUserQuery.data.value?.user?.id,
    (userId) => {
      if (!userId) {
        orderEventsClient.stop()
        return
      }

      orderEventsClient.start()
    },
    { immediate: true },
  )
})
