import { consumePostAuthRedirect } from './post-auth-redirect';
import type { RegisterRequest } from '~/shared/api/auth/contracts/register.contract';
import { authApi } from '~/shared/api/auth/auth.api';
import { routes } from '~/shared/navigation/routes';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (body: RegisterRequest) => {
      return authApi.register(body);
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });

        consumePostAuthRedirect();
        await navigateTo(routes.sell());
      }
    },
  });
}
