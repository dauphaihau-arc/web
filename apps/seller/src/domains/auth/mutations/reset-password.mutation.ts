import type { ResetPasswordRequest } from '~/domains/auth/api/contracts/reset-password.contract';
import { authApi } from '~/domains/auth/api/auth.api';
import { useAuthStore } from '~/domains/auth/stores/auth';

export function useResetPassword(token: string) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: ResetPasswordRequest['password']) => {
      return authApi.resetPassword(token, password, 'seller');
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        authStore.tokenResetPassword = '';
      }
    },
  });
}
