import type { MutationOptions } from '@tanstack/vue-query';
import { meAddressApi } from '~/domains/me/api/address/address.api';
import type { DeleteUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract';

export function useDeleteUserAddress(
  options?: MutationOptions<unknown, unknown, DeleteUserAddressRequest['id'], unknown>,
) {
  return useMutation({
    mutationKey: ['delete-user-address'],
    mutationFn: async (id: DeleteUserAddressRequest['id']) => {
      return await meAddressApi.delete(id);
    },
    ...options,
  });
}
