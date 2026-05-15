import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import dayjs from 'dayjs';
import { RESOURCES } from '~/config/enums/resources';
import type { User } from '~/types/user';
import { TOKEN_TYPES } from '~/config/enums/token';
import { ROUTES } from '~/config/enums/routes';
import { toastCustom } from '~/config/toast';
import type {
  LoginBody, RegisterBody, UserAuthenticated
} from '~/types/auth';
import { LOCAL_STORAGE_KEYS } from '~/config/enums/local-storage-keys';
import { useGetCart } from '~/services/cart';

export const setExpTokensToLS = () => {
  const config = useRuntimeConfig();
  localStorage[LOCAL_STORAGE_KEYS.ACCESS_TOKEN_EXP] = dayjs().add(Number(config.public.accessTokenExpirationMins), 'minutes');
  localStorage[LOCAL_STORAGE_KEYS.REFRESH_TOKEN_EXP] = dayjs().add(Number(config.public.refreshTokenExpirationDays), 'days');
};

export const clearExpTokensInLS = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN_EXP);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN_EXP);
};

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (body: RegisterBody) => {
      return useCustomFetch.post<{ user: UserAuthenticated }>(
        `${RESOURCES.AUTH}/register`,
        body
      );
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS();
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
      return useCustomFetch.post<{ user: UserAuthenticated }>(
        `${RESOURCES.AUTH}/login`,
        body
      );
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS();
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
      return useCustomFetch.post(
        `${RESOURCES.AUTH}/logout`,
        null
      );
    },
    onSuccess() {
      queryClient.setQueryData(['current-user'], { user: null });
      queryClient.setQueryData(['get-cart', 'my-cart'], null);
      clearExpTokensInLS();
      navigateTo(ROUTES.HOME);
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
      return useCustomFetch.post(
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
      return useCustomFetch.get(
        `${RESOURCES.AUTH}/verify-token?token=${token}&type=${TOKEN_TYPES.RESET_PASSWORD}`,
        undefined,
        options
      );
    },
  });
}

export function useResetPassword(token: string) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const { refetch: getCart } = useGetCart();

  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: (password: User['password']) => {
      return useCustomFetch.post<{ user: UserAuthenticated }>(
        `${RESOURCES.AUTH}/reset-password?token=${token}`,
        { password }
      );
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
        setExpTokensToLS();
        authStore.tokenResetPassword = '';
        getCart();
      }
    },
  });
}
