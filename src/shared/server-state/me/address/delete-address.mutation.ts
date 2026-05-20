import type { MutationOptions } from '@tanstack/vue-query';
import { meAddressApi } from '~/shared/api/me/address/address.api';
import type { UserAddress } from '~/shared/models/user-address';

export function useDeleteUserAddress(
  options?: MutationOptions<unknown, unknown, UserAddress['id'], unknown>
) {
  return useMutation({
    mutationKey: ['delete-user-address'],
    mutationFn: async (id: UserAddress['id']) => {
      return await meAddressApi.delete(id);
    },
    ...options,
  });
}
