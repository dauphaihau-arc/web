import { meApi } from '~/domains/me/api/me.api';

export const currentUserQueryOptions = {
  queryKey: ['current-user'],
  retry: false,
  staleTime: 60_000,
  refetchOnMount: false,
  queryFn: async () => {
    const user = await meApi.getCurrentOrGuest();
    return { user };
  },
} as const;

export function useGetCurrentUser() {
  return useQuery({
    ...currentUserQueryOptions,
  });
}
