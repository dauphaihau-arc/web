import { consumePostAuthRedirect } from '../utils/post-auth-redirect';
import type { LoginRequest } from '~/domains/auth/api/contracts/login.contract';
import { authApi } from '~/domains/auth/api/auth.api';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useMergeCart } from '~/domains/cart/mutations/merge-cart.mutation';
import { invalidateMarketSensitiveQueries } from '~/domains/market/queries/market-sensitive-queries';

export function useLogin() {
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();
  const { mutateAsync: mergeCart } = useMergeCart();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: (body: LoginRequest) => {
      return authApi.login({
        ...body,
        app: 'storefront',
      });
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        await mergeCart();
        await getCart();
        await invalidateMarketSensitiveQueries(queryClient);

        const redirectPath = consumePostAuthRedirect();
        if (redirectPath) {
          navigateTo(redirectPath);
        }
      }
    },
  });
}
