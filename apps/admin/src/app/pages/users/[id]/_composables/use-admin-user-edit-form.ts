import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import type { AdminUser, AdminUserStatus } from '~/domains/users/api/contracts/admin-users.contract';
import { useUpdateAdminUser } from '~/domains/users/mutations/update-user.mutation';
import {
  ADMIN_USER_STATUS_OPTIONS,
  isAdminUserStatus,
} from '~/domains/users/utils/user-presentation';

export function useAdminUserEditForm(
  userId: MaybeRefOrGetter<string>,
  user: MaybeRefOrGetter<AdminUser | undefined>,
  refetch: () => Promise<unknown>,
) {
  const displayName = ref('');
  const status = ref<AdminUserStatus>('active');
  const formError = ref('');
  const conflictMessage = ref('');
  const permissionMessage = ref('');

  const { mutateAsync, isPending } = useUpdateAdminUser();

  // The form always starts from the server's account, including after a
  // refetch, so a stale version can never be resubmitted silently.
  watch(() => toValue(user), (value) => {
    if (!value) {
      return;
    }

    displayName.value = value.display_name ?? '';
    status.value = isAdminUserStatus(value.status) ? value.status : 'active';
  }, { immediate: true });

  function setStatus(value: unknown) {
    if (isAdminUserStatus(value)) {
      status.value = value;
    }
  }

  function clearMessages() {
    formError.value = '';
    conflictMessage.value = '';
    permissionMessage.value = '';
  }

  async function submit() {
    clearMessages();

    const current = toValue(user);

    if (!current) {
      return;
    }

    const trimmedName = displayName.value.trim();

    try {
      await mutateAsync({
        userId: toValue(userId),
        body: {
          version: current.version,
          // An empty name is left out so the server keeps the stored value
          // instead of replacing it with a blank string.
          ...(trimmedName ? { display_name: trimmedName } : {}),
          status: status.value,
        },
      });
    }
    catch (error) {
      const apiError = readApiError(error);
      const statusCode = getStatusCode(error);

      if (statusCode === 409 && apiError.code === 'USER_VERSION_CONFLICT') {
        conflictMessage.value = 'This user changed since you loaded it. Refresh and retry.';
        await refetch();
        return;
      }

      if (statusCode === 403) {
        permissionMessage.value = 'Ask a platform administrator for user management access.';
        return;
      }

      formError.value = apiError.message ?? 'Could not update the user.';
    }
  }

  return {
    displayName,
    status,
    statusOptions: ADMIN_USER_STATUS_OPTIONS,
    isPending,
    formError,
    conflictMessage,
    permissionMessage,
    setStatus,
    submit,
  };
}
