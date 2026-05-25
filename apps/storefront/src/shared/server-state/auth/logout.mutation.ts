import { clearExpTokensInLS } from './token-storage'
import { routes } from '~/shared/navigation/routes'
import { toastCustom } from '~/shared/config/toast'
import { authApi } from '~/shared/api/auth/auth.api'
import { useWebPushNotifications } from '~/shared/composables/use-web-push-notifications'

export function useLogout() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { disable } = useWebPushNotifications()

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      await disable().catch(() => null)
      return authApi.logout()
    },
    onSuccess() {
      queryClient.setQueryData(['current-user'], { user: null })
      queryClient.setQueryData(['get-cart', 'my-cart'], null)
      clearExpTokensInLS()
      navigateTo(routes.home())
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'An unknown error occurred. Please try again',
      })
    },
  })
}
