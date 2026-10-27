import { useMutation } from '@tanstack/vue-query';
import { adminUsersApi } from '../api/admin-users.api';
import { ADMIN_USERS_LIST_KEY, adminUserDetailKey } from '../queries/query-keys';
import { toastCustom } from '~/shared/config/toast';

/**
 * Stores the account the server returned, because assignment replaces the
 * whole role set and the response is the only proof of the stored result.
 * Rejections stay with the caller so it can show the specific guard code.
 */
export function useAssignAdminUserRoles() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['admin-user-assign-roles'],
    mutationFn: (input: { userId: string, roles: string[] }) =>
      adminUsersApi.assignRoles(input.userId, { roles: input.roles }),
    onSuccess(result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Roles updated',
      });
      queryClient.setQueryData(adminUserDetailKey(variables.userId), result);
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_LIST_KEY });
    },
  });
}
