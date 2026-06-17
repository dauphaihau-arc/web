import type { ResetPasswordRequest } from '~/shared/api/auth/contracts/reset-password.contract'
import { authApi } from '~/shared/api/auth/auth.api'

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
        authStore.tokenResetPassword = ''
      }
    },
  })
}
