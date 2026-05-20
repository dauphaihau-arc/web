import { meAddressApi } from '~/shared/api/me/address/address.api';
import type { UserAddress } from '~/shared/models/user-address';

export function useUpdateUserAddress() {
  return useMutation({
    mutationKey: ['update-user-address'],
    mutationFn: async (body: Partial<UserAddress>) => {
      return await meAddressApi.update(body);
    },
  });
}
