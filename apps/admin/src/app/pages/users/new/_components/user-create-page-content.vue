<script setup lang="ts">
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import { usePermissions } from '~/shared/composables/use-permissions'
import { routes } from '~/shared/navigation/routes'
import UsersPermissionState from '../../_components/users-permission-state.vue'
import UserCreateForm from './user-create-form.vue'

const { can } = usePermissions()
const canManageUsers = computed(() => can(PERMISSIONS.usersManage))
</script>

<template>
  <LayoutAdminWrapperContent
    back-label="Users"
    :back-to="routes.users()"
    size="form"
    content-class="pb-12"
  >
    <template #title>
      New account
    </template>

    <template #description>
      Create a platform account and choose the roles it starts with.
    </template>

    <template #content>
      <UsersPermissionState v-if="!canManageUsers" />

      <UserCreateForm v-else />
    </template>
  </LayoutAdminWrapperContent>
</template>
