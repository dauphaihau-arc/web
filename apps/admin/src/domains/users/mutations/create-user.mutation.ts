import { useMutation } from '@tanstack/vue-query';
import type { CreateAdminUserBody } from '../api/contracts/admin-users.contract';
import { adminUsersApi } from '../api/admin-users.api';
import { ADMIN_USERS_LIST_KEY, adminUserDetailKey } from '../queries/query-keys';
import { toastCustom } from '~/shared/config/toast';

/**
 * The server creates the account with the default customer role, so the
 * returned user is the one the role-assignment follow-up must target.
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['admin-user-create'],
    mutationFn: (body: CreateAdminUserBody) => adminUsersApi.create(body),
    onSuccess(result) {
      toast.add({
        ...toastCustom.success,
        title: 'Account created',
      });
      queryClient.setQueryData(adminUserDetailKey(result.id), result);
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_LIST_KEY });
    },
  });
}
