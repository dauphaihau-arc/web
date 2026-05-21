import { setExpTokensToLS } from './token-storage';
import type { RegisterRequest } from '~/shared/api/auth/contracts/register.contract';
import { authApi } from '~/shared/api/auth/auth.api';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (body: RegisterRequest) => {
      return authApi.register(body);
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS(queryClient);
      }
    },
  });
}
