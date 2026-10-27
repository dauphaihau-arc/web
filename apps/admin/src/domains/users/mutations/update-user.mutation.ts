import { useMutation } from '@tanstack/vue-query';
import type { UpdateAdminUserBody } from '../api/contracts/admin-users.contract';
import { adminUsersApi } from '../api/admin-users.api';
import { ADMIN_USERS_LIST_KEY, adminUserDetailKey } from '../queries/query-keys';
import { toastCustom } from '~/shared/config/toast';

/**
 * Stores the server's answer rather than an optimistic guess: the response is
 * the authoritative account, including the bumped version the next edit must
 * submit. Rejections are left to the caller so it can render the specific
 * conflict or permission state instead of a generic failure toast.
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['admin-user-update'],
    mutationFn: (input: { userId: string, body: UpdateAdminUserBody }) =>
      adminUsersApi.update(input.userId, input.body),
    onSuccess(result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'User updated',
      });
      queryClient.setQueryData(adminUserDetailKey(variables.userId), result);
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_LIST_KEY });
    },
  });
}
