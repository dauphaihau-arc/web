import { clearExpTokensInLS } from './token-storage'
import { routes } from '~/shared/navigation/routes'
import { toastCustom } from '~/shared/config/toast'
import { authApi } from '~/shared/api/auth/auth.api'

const sellerUserScopedQueryKeys = [
  ['my-shop'],
  ['my-notifications'],
  ['my-notifications-unread-count'],
  ['shop-chat-conversations'],
  ['shop-chat-unread-count'],
  ['shop-chat-messages'],
  ['shop-orders'],
  ['shop-order-detail'],
  ['shop-get-products'],
  ['shop-get-detail-product'],
  ['shop-get-coupons'],
] as const

export function useLogout() {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => {
      return authApi.logout()
    },
    onSuccess() {
      for (const queryKey of sellerUserScopedQueryKeys) {
        queryClient.removeQueries({ queryKey })
      }

      queryClient.setQueryData(['current-user'], { user: null })
      clearExpTokensInLS()
      navigateTo(routes.login())
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'An unknown error occurred. Please try again',
      })
    },
  })
}
