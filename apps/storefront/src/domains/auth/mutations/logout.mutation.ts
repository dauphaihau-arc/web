import { routes } from '~/shared/navigation/routes';
import { toastCustom } from '~/shared/config/toast';
import { authApi } from '~/domains/auth/api/auth.api';
import { useWebPushNotifications } from '~/domains/me/composables/use-web-push-notifications';
import { useLocalizedRoute } from '~/shared/composables/use-localized-route';
import { useErrorCopy } from '~/shared/composables/use-error-copy';
import { reportApiError } from '~/shared/utils/api-error-copy';
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract';

const storefrontUserScopedQueryKeys = [
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
  const t = useErrorCopy();
  const queryClient = useQueryClient();
  const { disable } = useWebPushNotifications();
  const { localizePath } = useLocalizedRoute();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      await disable().catch(() => null);
      return authApi.logout();
    },
    onSuccess() {
      void queryClient.cancelQueries({ queryKey: ['get-cart'] });

      queryClient.setQueryData<GetCartResponse>(
        ['get-cart', 'my-cart'],
        oldData => oldData ? { ...oldData, cart: null } : oldData,
      );

      for (const queryKey of storefrontUserScopedQueryKeys) {
        queryClient.removeQueries({ queryKey });
      }

      queryClient.setQueryData(['current-user'], { user: null });
      navigateTo(localizePath(routes.home()));
    },
    onError(error) {
      reportApiError(error, 'logout');

      toast.add({
        ...toastCustom.error,
        title: t('errors.auth.logoutFailed'),
      });
    },
  });
}
