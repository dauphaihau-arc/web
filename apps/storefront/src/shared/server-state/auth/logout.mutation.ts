import { clearExpTokensInLS } from './token-storage';
import { routes } from '~/shared/navigation/routes';
import { toastCustom } from '~/shared/config/toast';
import { authApi } from '~/shared/api/auth/auth.api';
import { useWebPushNotifications } from '~/shared/composables/use-web-push-notifications';

const storefrontUserScopedQueryKeys = [
  ['get-cart'],
  ['my-notifications'],
  ['my-notifications-unread-count'],
  ['my-chat-conversations'],
  ['my-chat-unread-count'],
  ['my-chat-messages'],
  ['get-user-addresses'],
  ['get-order-shops'],
  ['get-order-by-id'],
] as const;

export function useLogout() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { disable } = useWebPushNotifications();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      await disable().catch(() => null);
      return authApi.logout();
    },
    onSuccess() {
      for (const queryKey of storefrontUserScopedQueryKeys) {
        queryClient.removeQueries({ queryKey });
      }

      queryClient.setQueryData(['current-user'], { user: null });
      clearExpTokensInLS();
      navigateTo(routes.home());
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'An unknown error occurred. Please try again',
      });
    },
  });
}
