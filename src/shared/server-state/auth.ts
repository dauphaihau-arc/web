import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { QueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import { RESOURCES } from '~/shared/config/enums/resources';
import type { User } from '~/shared/types/user';
import { TokenTypes } from '~/shared/config/enums/token';
import { routes } from '~/shared/navigation/routes';
import { toastCustom } from '~/shared/config/toast';
import { apiClient } from '~/shared/lib/api-client';
import type {
  AuthClientConfig, LoginBody, RegisterBody, UserAuthenticated
} from '~/shared/types/auth';
import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys';
import { useGetCart } from '~/shared/server-state/cart';
import { DEFAULT_AUTH_CLIENT_CONFIG } from '~/shared/utils/password-policy';

export const setExpTokensToLS = (queryClient?: Pick<QueryClient, 'getQueryData'>) => {
  const authClientConfig = queryClient?.getQueryData<AuthClientConfig>(['auth', 'client-config']) ??
    DEFAULT_AUTH_CLIENT_CONFIG;

  localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP] = dayjs()
    .add(authClientConfig.session.access_token_ttl_seconds, 'seconds')
    .toISOString();
  localStorage[LocalStorageKeys.REFRESH_TOKEN_EXP] = dayjs()
    .add(authClientConfig.session.refresh_token_ttl_seconds, 'seconds')
    .toISOString();
};

export const clearExpTokensInLS = () => {
  localStorage.removeItem(LocalStorageKeys.REFRESH_TOKEN_EXP);
  localStorage.removeItem(LocalStorageKeys.ACCESS_TOKEN_EXP);
};

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (body: RegisterBody) => {
      return apiClient.post<{ user: UserAuthenticated }>(
        `${RESOURCES.AUTH}/register`,
        {
          email: body.email,
          password: body.password,
          display_name: body.display_name,
          preferences: body.preferences,
        }
      );
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS(queryClient);
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: (body: LoginBody) => {
      return apiClient.post<{ user: UserAuthenticated }>(
        `${RESOURCES.AUTH}/login`,
        body
      );
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

export function useLogout() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => {
      return apiClient.post(
        `${RESOURCES.AUTH}/logout`,
        null
      );
    },
    onSuccess() {
      queryClient.setQueryData(['current-user'], { user: null });
      queryClient.setQueryData(['get-cart', 'my-cart'], null);
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

export function useForgetPassword() {
  return useMutation({
    mutationKey: ['forget-password'],
    mutationFn: (email: User['email']) => {
      return apiClient.post(
        `${RESOURCES.AUTH}/forgot-password`,
        { email }
      );
    },
  });
}

export function useVerifyToken(
  token?: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!token,
    retry: false,
    queryKey: ['verify-token'],
    queryFn: () => {
      return apiClient.get(
        `${RESOURCES.AUTH}/verify-token?token=${token}&type=${TokenTypes.RESET_PASSWORD}`,
        undefined,
        options
      );
    },
  });
}

export const authClientConfigQueryOptions = {
  queryKey: ['auth', 'client-config'],
  queryFn: () => {
    return apiClient.get<AuthClientConfig>(`${RESOURCES.AUTH}/client-config`, undefined, undefined, {
      retryOnWakeUp: true,
    });
  },
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 24,
} as const;

export function useAuthClientConfig() {
  return useQuery(authClientConfigQueryOptions);
}

export function useResetPassword(token: string) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: User['password']) => {
      return apiClient.post<{ user: UserAuthenticated }>(
        `${RESOURCES.AUTH}/reset-password?token=${token}`,
        { password }
      );
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS(queryClient);
        authStore.tokenResetPassword = '';
        getCart();
      }
    },
  });
}
