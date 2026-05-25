import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useWebPushNotifications } from '~/shared/composables/use-web-push-notifications'

export default defineNuxtPlugin(() => {
  const currentUserQuery = useGetCurrentUser()
  const {
    syncStatusFromBrowser,
    syncSubscriptionWithServer,
  } = useWebPushNotifications()

  void syncStatusFromBrowser()

  watch(
    () => currentUserQuery.data.value?.user?.id,
    async (userId) => {
      if (!userId || Notification.permission !== 'granted') {
        return
      }

      await syncSubscriptionWithServer()
    },
    { immediate: true },
  )
})
