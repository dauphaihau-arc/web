import type { UserAuthenticated } from '~/shared/api/auth/contracts/auth-user.contract';
import { meApi } from '~/shared/api/me/me.api';
import type { UpdateMeRequest as UpdateCurrentUserRequest } from '~/shared/api/auth/contracts/update-me.contract';
import { toastCustom } from '~/shared/config/toast';

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['update-current-user'],
    mutationFn: async (body: UpdateCurrentUserRequest) => {
      return await meApi.updateCurrent(body);
    },
    onSuccess: (user) => {
      queryClient.setQueryData<{ user: UserAuthenticated } | null>(['current-user'], (current) => {
        if (!current?.user) {
          return { user };
        }

        return {
          user: {
            ...current.user,
            ...user,
          },
        };
      });
    },
    onError: () => {
      toast.add({
        ...toastCustom.error,
        title: 'Update user failed',
      });
    },
  });
}
