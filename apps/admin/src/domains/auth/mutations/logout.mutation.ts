import { routes } from '~/shared/navigation/routes';
import { authApi } from '~/domains/auth/api/auth.api';

const adminUserScopedQueryKeys = [
  ['admin-orders'],
] as const;

export function useLogout() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => {
      return authApi.logout();
    },
    onSuccess() {
      for (const queryKey of adminUserScopedQueryKeys) {
        queryClient.removeQueries({ queryKey });
      }

      queryClient.setQueryData(['current-user'], { user: null });
      navigateTo(routes.login());
    },
    onError() {
      toast.add({
        color: 'red',
        title: 'An unknown error occurred. Please try again',
      });
    },
  });
}
