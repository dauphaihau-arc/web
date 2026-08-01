import { meAddressApi } from '~/domains/me/api/address/address.api';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';

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
