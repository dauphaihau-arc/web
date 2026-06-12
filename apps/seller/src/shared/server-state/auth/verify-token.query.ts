import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { TokenTypes } from '@arc/enums/token';
import { authApi } from '~/shared/api/auth/auth.api';

export function useVerifyToken(
  token?: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!token,
    retry: false,
    queryKey: ['verify-token'],
    queryFn: () => {
      return authApi.verifyToken(
        token!,
        TokenTypes.RESET_PASSWORD,
        options
      );
    },
  });
}
