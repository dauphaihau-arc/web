import { consumePostAuthRedirect } from './post-auth-redirect';
import type { LoginRequest } from '~/shared/api/auth/contracts/login.contract';
import { authApi } from '~/shared/api/auth/auth.api';
import { useGetCart } from '~/shared/server-state/cart/cart.query';
import { useMergeCart } from '~/shared/server-state/cart/merge-cart.mutation';

export function useLogin() {
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();
  const { mutateAsync: mergeCart } = useMergeCart();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: (body: LoginRequest) => {
      return authApi.login(body);
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
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
