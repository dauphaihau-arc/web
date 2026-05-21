import { meAddressApi } from '~/shared/api/me/address/address.api';
import type { CreateUserAddressRequest } from '~/shared/api/me/address/contracts/address.contract';

export function useCreateUserAddress() {
  return useMutation({
    mutationKey: ['create-user-address'],
    mutationFn: async (body: CreateUserAddressRequest) => {
      return await meAddressApi.create(body);
    },
  });
}
