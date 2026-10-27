import { resolvePostAuthRedirect } from '../utils/post-auth-redirect';
import type { LoginRequest } from '~/domains/auth/api/contracts/login.contract';
import { authApi } from '~/domains/auth/api/auth.api';
import { routes } from '~/shared/navigation/routes';
import {
  AdminAccessRequiredError,
  hasAdminRole,
} from '~/domains/auth/utils/admin-access';

export function useLogin() {
  const queryClient = useQueryClient();
  const route = useRoute();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: async (body: LoginRequest) => {
      const response = await authApi.login({
        ...body,
        app: 'admin',
      });

      if (hasAdminRole(response.user)) {
        return response;
      }

      await authApi.logout().catch(() => undefined);
      throw new AdminAccessRequiredError();
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });

        const redirectPath = resolvePostAuthRedirect(route.query.redirect);
        if (redirectPath) {
          await navigateTo(redirectPath);
          return;
        }

        await navigateTo(routes.shops());
      }
    },
  });
}
