import { setExpTokensToLS } from './token-storage';
import type { ResetPasswordRequest } from '~/shared/api/auth/contracts/reset-password.contract';
import { authApi } from '~/shared/api/auth/auth.api';
import { useGetCart } from '~/shared/server-state/me/cart/cart.query';

export function useResetPassword(token: string) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: ResetPasswordRequest['password']) => {
      return authApi.resetPassword(token, password);
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS(queryClient);
        authStore.tokenResetPassword = '';
        getCart();
      }
    },
  });
}
