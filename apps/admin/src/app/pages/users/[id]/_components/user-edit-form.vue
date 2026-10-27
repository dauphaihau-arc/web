<script setup lang="ts">
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import type { AdminUser } from '~/domains/users/api/contracts/admin-users.contract'
import { usePermissions } from '~/shared/composables/use-permissions'
import { useAdminUserEditForm } from '../_composables/use-admin-user-edit-form'

const props = defineProps<{
  userId: string
  user: AdminUser
  refetch: () => Promise<unknown>
}>()

const { can } = usePermissions()
const canManageUsers = computed(() => can(PERMISSIONS.usersManage))

const {
  displayName,
  status,
  statusOptions,
  isPending,
  formError,
  conflictMessage,
  permissionMessage,
  setStatus,
  submit,
} = useAdminUserEditForm(
  () => props.userId,
  () => props.user,
  () => props.refetch(),
)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Edit account
    </div>
    <form
      v-if="canManageUsers"
      class="mt-4 space-y-4"
      @submit.prevent="submit"
    >
      <UFormGroup label="Display name">
        <UInput
          v-model="displayName"
          type="text"
          placeholder="Display name"
          :disabled="isPending"
        />
      </UFormGroup>

      <UFormGroup label="Status">
        <USelectMenu
          :model-value="status"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
          :disabled="isPending"
          @update:model-value="setStatus"
        />
      </UFormGroup>

      <p
        v-if="conflictMessage"
        class="text-sm text-state-warning-text"
      >
        {{ conflictMessage }}
      </p>

      <p
        v-if="permissionMessage"
        class="text-sm text-state-warning-text"
      >
        {{ permissionMessage }}
      </p>

      <p
        v-if="formError"
        class="text-sm text-state-danger-text"
      >
        {{ formError }}
      </p>

      <UButton
        type="submit"
        :loading="isPending"
        :disabled="isPending"
      >
        Save changes
      </UButton>
    </form>

    <p
      v-else
      class="mt-3 text-sm text-text-subtle"
    >
      Ask a platform administrator for user management access.
    </p>
  </UCard>
</template>
