import { meAddressApi } from '~/domains/me/api/address/address.api';
import type { CreateUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract';

export function useCreateUserAddress() {
  return useMutation({
    mutationKey: ['create-user-address'],
    mutationFn: async (body: CreateUserAddressRequest) => {
      return await meAddressApi.create(body);
    },
  });
}
