<script setup lang="ts">
import type { AdminUser } from '~/domains/users/api/contracts/admin-users.contract'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { formatUserRoleLabel } from '~/domains/users/utils/user-presentation'
import { useAdminUserRolesForm } from '../_composables/use-admin-user-roles-form'

const props = defineProps<{
  userId: string
  user: AdminUser
}>()

const {
  selectedRoles,
  roleOptions,
  errorMessage,
  isPending,
  canManageRoles,
  isRolesLoading,
  hasChanges,
  setRoles,
  submit,
} = useAdminUserRolesForm(
  () => props.userId,
  () => props.user,
)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Roles
    </div>

    <div class="mt-4 space-y-4 text-sm">
      <div class="flex flex-wrap items-center gap-1">
        <StatusBadge
          v-for="role in user.roles"
          :key="role"
          color="gray"
          class="capitalize"
        >
          {{ formatUserRoleLabel(role) }}
        </StatusBadge>
        <span
          v-if="user.roles.length === 0"
          class="text-sm text-text-muted"
        >
          No roles
        </span>
      </div>

      <form
        v-if="canManageRoles"
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UFormGroup
          label="Assign roles"
          help="Replaces every role the account currently holds."
        >
          <USelectMenu
            :model-value="selectedRoles"
            :options="roleOptions"
            value-attribute="value"
            option-attribute="label"
            multiple
            :disabled="isPending || isRolesLoading"
            @update:model-value="setRoles"
          />
        </UFormGroup>

        <p
          v-if="errorMessage"
          class="text-sm text-state-danger-text"
        >
          {{ errorMessage }}
        </p>

        <UButton
          type="submit"
          :loading="isPending"
          :disabled="isPending || isRolesLoading || !hasChanges"
        >
          Save roles
        </UButton>
      </form>

      <p
        v-else
        class="text-sm text-text-subtle"
      >
        Ask a platform administrator for role management access.
      </p>
    </div>
  </UCard>
</template>
