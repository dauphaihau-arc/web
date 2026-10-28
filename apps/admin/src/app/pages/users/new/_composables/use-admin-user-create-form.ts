import { getStatusCode } from '@arc/lib';
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated';
import { readApiError } from '~/shared/lib/api-error';
import type { AdminUser } from '~/domains/users/api/contracts/admin-users.contract';
import { usePermissions } from '~/shared/composables/use-permissions';
import { useAdminRoles } from '~/domains/users/queries/roles.query';
import { useCreateAdminUser } from '~/domains/users/mutations/create-user.mutation';
import { useAssignAdminUserRoles } from '~/domains/users/mutations/assign-roles.mutation';
import { toastCustom } from '~/shared/config/toast';
import { routes } from '~/shared/navigation/routes';

const MIN_PASSWORD_LENGTH = 8;

export function useAdminUserCreateForm() {
  const { can } = usePermissions();
  const toast = useToast();
  const canManageRoles = computed(() => can(PERMISSIONS.rolesManage));
  const rolesQuery = useAdminRoles(canManageRoles);

  const email = ref('');
  const password = ref('');
  const displayName = ref('');
  const selectedRoles = ref<string[]>([]);
  const formError = ref('');
  const isSubmitting = ref(false);

  const createMutation = useCreateAdminUser();
  const assignRolesMutation = useAssignAdminUserRoles();

  const roleOptions = computed(() =>
    (rolesQuery.data.value?.roles ?? []).map(role => ({
      label: role.name,
      value: role.key,
    })),
  );

  function setRoles(value: unknown) {
    if (Array.isArray(value)) {
      selectedRoles.value = value.filter((role): role is string => typeof role === 'string');
    }
  }

  async function submit() {
    formError.value = '';

    const trimmedEmail = email.value.trim();
    const trimmedName = displayName.value.trim();

    if (!trimmedEmail) {
      formError.value = 'Enter an email address.';
      return;
    }

    if (password.value.length < MIN_PASSWORD_LENGTH) {
      formError.value = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
      return;
    }

    isSubmitting.value = true;

    let created: AdminUser;

    try {
      created = await createMutation.mutateAsync({
        email: trimmedEmail,
        password: password.value,
        ...(trimmedName ? { display_name: trimmedName } : {}),
      });
    }
    catch (error) {
      formError.value = getStatusCode(error) === 403
        ? 'Ask a platform administrator for user management access.'
        : readApiError(error).message ?? 'Could not create the account.';
      return;
    }
    finally {
      isSubmitting.value = false;
    }

    const roles = canManageRoles.value ? selectedRoles.value : [];

    if (roles.length > 0) {
      try {
        await assignRolesMutation.mutateAsync({ userId: created.id, roles });
      }
      catch (error) {
        // The account exists at this point; the detail page can retry the
        // assignment without creating a duplicate.
        toast.add({
          ...toastCustom.warning,
          title: 'Account created, but roles were not assigned',
          description: readApiError(error).message,
        });
      }
    }

    await navigateTo(routes.userDetail(created.id));
  }

  return {
    email,
    password,
    displayName,
    selectedRoles,
    roleOptions,
    formError,
    isSubmitting,
    canManageRoles,
    isLoadingRoles: computed(() => canManageRoles.value && rolesQuery.isPending.value),
    setRoles,
    submit,
  };
}
