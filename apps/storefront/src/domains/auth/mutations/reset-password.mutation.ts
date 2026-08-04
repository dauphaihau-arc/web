import { consumePostAuthRedirect } from '../utils/post-auth-redirect';
import type { ResetPasswordRequest } from '~/domains/auth/api/contracts/reset-password.contract';
import { authApi } from '~/domains/auth/api/auth.api';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useMergeCart } from '~/domains/cart/mutations/merge-cart.mutation';

export function useResetPassword(token: string) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();
  const { mutateAsync: mergeCart } = useMergeCart();

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: ResetPasswordRequest['password']) => {
      return authApi.resetPassword(token, password, 'storefront');
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
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
