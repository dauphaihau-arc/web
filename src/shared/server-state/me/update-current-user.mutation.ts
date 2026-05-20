import type { UserAuthenticated } from '~/shared/api/auth/login';
import { meApi } from '~/shared/api/me/me.api';
import type { UpdateCurrentUserRequest } from '~/shared/api/me/update-current-user';
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
