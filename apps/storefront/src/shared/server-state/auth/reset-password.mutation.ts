import { setExpTokensToLS } from './token-storage';
import { consumePostAuthRedirect } from './post-auth-redirect';
import type { ResetPasswordRequest } from '~/shared/api/auth/contracts/reset-password.contract';
import { authApi } from '~/shared/api/auth/auth.api';
import { useGetCart } from '~/shared/server-state/cart/cart.query';
import { useMergeCart } from '~/shared/server-state/cart/merge-cart.mutation';

export function useResetPassword(token: string) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();
  const { mutateAsync: mergeCart } = useMergeCart();

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: ResetPasswordRequest['password']) => {
      return authApi.resetPassword(token, password);
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS(queryClient);
        authStore.tokenResetPassword = '';
        await mergeCart();
        await getCart();

        const redirectPath = consumePostAuthRedirect();
        if (redirectPath) {
          navigateTo(redirectPath);
        }
      }
    },
  });
}
