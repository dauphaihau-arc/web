import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated';
import { readApiError } from '~/shared/lib/api-error';
import type { AdminUser } from '~/domains/users/api/contracts/admin-users.contract';
import { usePermissions } from '~/shared/composables/use-permissions';
import { useAdminRoles } from '~/domains/users/queries/roles.query';
import { useAssignAdminUserRoles } from '~/domains/users/mutations/assign-roles.mutation';

export function useAdminUserRolesForm(
  userId: MaybeRefOrGetter<string>,
  user: MaybeRefOrGetter<AdminUser | undefined>,
) {
  const { can } = usePermissions();
  const canManageRoles = computed(() => can(PERMISSIONS.rolesManage));
  const rolesQuery = useAdminRoles(canManageRoles);

  const selectedRoles = ref<string[]>([]);
  const errorMessage = ref('');

  const assignRolesMutation = useAssignAdminUserRoles();
  const isPending = assignRolesMutation.isPending;

  const roleOptions = computed(() =>
    (rolesQuery.data.value?.roles ?? []).map(role => ({
      label: role.name,
      value: role.key,
    })),
  );

  // The selection mirrors the stored roles, so the server response after a
  // successful save becomes the new baseline without a manual reload.
  watch(() => toValue(user), (value) => {
    selectedRoles.value = value ? [...value.roles] : [];
  }, { immediate: true });

  const hasChanges = computed(() => {
    const current = [...(toValue(user)?.roles ?? [])].sort();
    const next = [...selectedRoles.value].sort();

    return current.length !== next.length
      || current.some((role, index) => role !== next[index]);
  });

  function setRoles(value: unknown) {
    if (Array.isArray(value)) {
      selectedRoles.value = value.filter((role): role is string => typeof role === 'string');
    }
  }

  async function submit() {
    errorMessage.value = '';

    try {
      await assignRolesMutation.mutateAsync({
        userId: toValue(userId),
        roles: [...selectedRoles.value],
      });
    }
    catch (error) {
      // The guard messages (unknown role, self role change, last admin role)
      // are written for operators; show them instead of a generic failure.
      const apiError = readApiError(error);

      errorMessage.value = apiError.message ?? 'Could not update roles.';
    }
  }

  return {
    selectedRoles,
    roleOptions,
    errorMessage,
    isPending,
    canManageRoles,
    isRolesLoading: computed(() => canManageRoles.value && rolesQuery.isPending.value),
    hasChanges,
    setRoles,
    submit,
  };
}
