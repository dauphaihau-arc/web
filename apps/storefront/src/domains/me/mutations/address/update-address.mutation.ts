import { meAddressApi } from '~/domains/me/api/address/address.api';
import type { UpdateUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract';

export function useUpdateUserAddress() {
  return useMutation({
    mutationKey: ['update-user-address'],
    mutationFn: async (body: UpdateUserAddressRequest) => {
      return await meAddressApi.update(body);
    },
  });
}
