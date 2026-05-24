import { setExpTokensToLS } from './token-storage'
import { consumePostAuthRedirect } from './post-auth-redirect'
import type { ResetPasswordRequest } from '~/shared/api/auth/contracts/reset-password.contract'
import { authApi } from '~/shared/api/auth/auth.api'
import { routes } from '~/shared/navigation/routes'

export function useResetPassword(token: string) {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: ResetPasswordRequest['password']) => {
      return authApi.resetPassword(token, password)
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user })
        setExpTokensToLS(queryClient)
        authStore.tokenResetPassword = ''

        const redirectPath = consumePostAuthRedirect()
        if (redirectPath) {
          await navigateTo(redirectPath)
          return
        }

        await navigateTo(routes.accountShopProducts())
      }
    },
  })
}
