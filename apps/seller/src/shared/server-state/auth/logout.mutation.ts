import { clearExpTokensInLS } from './token-storage'
import { routes } from '~/shared/navigation/routes'
import { toastCustom } from '~/shared/config/toast'
import { authApi } from '~/shared/api/auth/auth.api'

export function useLogout() {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => {
      return authApi.logout()
    },
    onSuccess() {
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
