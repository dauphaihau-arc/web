import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys';
import { meApi } from '~/shared/api/me/me.api';

export function hasStoredSession() {
  return Boolean(
    localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP] ||
    localStorage[LocalStorageKeys.REFRESH_TOKEN_EXP]
  );
}

export const currentUserQueryOptions = {
  queryKey: ['current-user'],
  retry: false,
  queryFn: async () => {
    const user = await meApi.getCurrent();
    return { user };
  },
} as const;

export function useGetCurrentUser() {
  return useQuery({
    enabled: hasStoredSession(),
    ...currentUserQueryOptions,
  });
}
