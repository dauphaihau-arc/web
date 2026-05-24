import type { ForgotPasswordRequest } from '~/shared/api/auth/contracts/forgot-password.contract'
import { authApi } from '~/shared/api/auth/auth.api'

export function useForgetPassword() {
  return useMutation({
    mutationKey: ['forget-password'],
    mutationFn: (email: ForgotPasswordRequest['email']) => {
      return authApi.forgotPassword({ email })
    },
  })
}
