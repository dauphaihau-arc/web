import { meAddressApi } from '~/shared/api/me/address/address.api';

export function useGetUserAddresses() {
  return useQuery({
    queryKey: ['get-user-addresses'],
    queryFn: () => {
      return meAddressApi.getList();
    },
  });
}
