import { consumePostAuthRedirect } from '../utils/post-auth-redirect';
import type { RegisterRequest } from '~/domains/auth/api/contracts/register.contract';
import { authApi } from '~/domains/auth/api/auth.api';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useMergeCart } from '~/domains/cart/mutations/merge-cart.mutation';
import { invalidateMarketSensitiveQueries } from '~/domains/market/queries/market-sensitive-queries';

export function useRegister() {
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();
  const { mutateAsync: mergeCart } = useMergeCart();

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (body: RegisterRequest) => {
      return authApi.register(body);
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
