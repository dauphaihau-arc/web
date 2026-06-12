import { meApi } from '~/shared/api/me/me.api';

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
    ...currentUserQueryOptions,
  });
}
