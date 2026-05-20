import type { User } from '~/shared/models/user';
import { authApi } from '~/shared/api/auth/auth.api';

export function useForgetPassword() {
  return useMutation({
    mutationKey: ['forget-password'],
    mutationFn: (email: User['email']) => {
      return authApi.forgotPassword({ email });
    },
  });
}
