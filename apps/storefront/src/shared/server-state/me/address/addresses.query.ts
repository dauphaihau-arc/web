import { meAddressApi } from '~/shared/api/me/address/address.api';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';

export function useGetUserAddresses() {
  const { data: currentUser } = useGetCurrentUser();

  return useQuery({
    enabled: computed(() => !!currentUser.value?.user),
    queryKey: ['get-user-addresses'],
    queryFn: () => {
      return meAddressApi.getList();
    },
  });
}
