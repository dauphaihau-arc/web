import { meAddressApi } from '~/shared/api/me/address/address.api';
import { hasStoredSession } from '~/shared/server-state/me/current-user.query';

export function useGetUserAddresses() {
  return useQuery({
    enabled: hasStoredSession(),
    queryKey: ['get-user-addresses'],
    queryFn: () => {
      return meAddressApi.getList();
    },
  });
}
