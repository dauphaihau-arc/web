import type { ForgotPasswordRequest } from '~/domains/auth/api/contracts/forgot-password.contract';
import { authApi } from '~/domains/auth/api/auth.api';

export function useForgetPassword() {
  return useMutation({
    mutationKey: ['forget-password'],
    mutationFn: (email: ForgotPasswordRequest['email']) => {
      return authApi.forgotPassword({ email, app: 'seller' });
    },
  });
}
