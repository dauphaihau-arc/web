import { isPermissionKey } from '@arc/schemas/api/auth/permissions.generated';
import type { PermissionKey } from '@arc/schemas/api/auth/permissions.generated';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';

export function usePermissions() {
  const { data } = useGetCurrentUser();
  const permissions = computed(() => data.value?.user?.permissions ?? []);

  function can(permission: PermissionKey): boolean {
    return permissions.value.includes(permission);
  }

  function canAny(required: readonly PermissionKey[]): boolean {
    return required.some(permission => permissions.value.includes(permission));
  }

  if (import.meta.dev) {
    let hasWarned = false;
    watch(permissions, (values) => {
      if (hasWarned) {
        return;
      }
      const unknown = values.filter(value => !isPermissionKey(value));
      if (unknown.length > 0) {
        hasWarned = true;
        console.warn(
          '[usePermissions] Unknown permission keys returned by the API:',
          unknown,
        );
      }
    }, { immediate: true });
  }

  return {
    can,
    canAny,
  };
}
