import { authApi } from '~/shared/api/auth/auth.api';

export const authClientConfigQueryOptions = {
  queryKey: ['auth', 'client-config'],
  queryFn: () => {
    return authApi.getClientConfig();
  },
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 24,
} as const;

export function useAuthClientConfig() {
  return useQuery(authClientConfigQueryOptions);
}
