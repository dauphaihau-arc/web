import { meAddressApi } from '~/shared/api/me/address/address.api';
import type { UpdateUserAddressRequest } from '~/shared/api/me/address/contracts/address.contract';

export function useUpdateUserAddress() {
  return useMutation({
    mutationKey: ['update-user-address'],
    mutationFn: async (body: UpdateUserAddressRequest) => {
      return await meAddressApi.update(body);
    },
  });
}
