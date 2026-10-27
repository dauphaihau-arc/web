<script setup lang="ts">
import { useAdminUserCreateForm } from '../_composables/use-admin-user-create-form'
import { routes } from '~/shared/navigation/routes'

const {
  email,
  password,
  displayName,
  selectedRoles,
  roleOptions,
  formError,
  isSubmitting,
  canManageRoles,
  isLoadingRoles,
  setRoles,
  submit,
} = useAdminUserCreateForm()
</script>

<template>
  <UCard>
    <form
      class="space-y-4"
      @submit.prevent="submit"
    >
      <UFormGroup label="Email">
        <UInput
          v-model="email"
          type="email"
          autocomplete="off"
          :disabled="isSubmitting"
        />
      </UFormGroup>

      <UFormGroup
        label="Password"
        help="At least 8 characters."
      >
        <UInput
          v-model="password"
          type="password"
          autocomplete="new-password"
          :disabled="isSubmitting"
        />
      </UFormGroup>

      <UFormGroup label="Display name">
        <UInput
          v-model="displayName"
          type="text"
          :disabled="isSubmitting"
        />
      </UFormGroup>

      <UFormGroup
        v-if="canManageRoles"
        label="Roles"
        help="Leave empty to create a customer account."
      >
        <USelectMenu
          :model-value="selectedRoles"
          :options="roleOptions"
          value-attribute="value"
          option-attribute="label"
          multiple
          :disabled="isSubmitting || isLoadingRoles"
          @update:model-value="setRoles"
        />
      </UFormGroup>

      <p
        v-if="formError"
        class="text-sm text-state-danger-text"
      >
        {{ formError }}
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <UButton
          type="submit"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          Create account
        </UButton>

        <UButton
          :to="routes.users()"
          color="gray"
          variant="ghost"
          :disabled="isSubmitting"
        >
          Cancel
        </UButton>
      </div>
    </form>
  </UCard>
</template>
