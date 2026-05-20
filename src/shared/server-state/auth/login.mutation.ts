import { setExpTokensToLS } from './token-storage';
import type { LoginRequest } from '~/shared/api/auth/login';
import { authApi } from '~/shared/api/auth/auth.api';
import { useGetCart } from '~/shared/server-state/me/cart/cart.query';

export function useLogin() {
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: (body: LoginRequest) => {
      return authApi.login(body);
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS(queryClient);
        getCart();
      }
    },
  });
}
