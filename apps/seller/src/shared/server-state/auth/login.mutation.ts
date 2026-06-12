import { clearExpTokensInLS } from './token-storage';
import { consumePostAuthRedirect } from './post-auth-redirect';
import type { LoginRequest } from '~/shared/api/auth/contracts/login.contract';
import { authApi } from '~/shared/api/auth/auth.api';
import { routes } from '~/shared/navigation/routes';
import {
  hasSellerAccess,
  SellerAccessRequiredError
} from '~/shared/utils/seller-access';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: async (body: LoginRequest) => {
      const response = await authApi.login(body);

      if (hasSellerAccess(response.user)) {
        return response;
      }

      await authApi.logout().catch(() => undefined);
      clearExpTokensInLS();
      throw new SellerAccessRequiredError();
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });

        const redirectPath = consumePostAuthRedirect();
        if (redirectPath) {
          await navigateTo(redirectPath);
          return;
        }

        await navigateTo(routes.products());
      }
    },
  });
}
