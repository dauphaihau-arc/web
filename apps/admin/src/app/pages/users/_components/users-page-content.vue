<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import { usePermissions } from '~/shared/composables/use-permissions'
import { routes } from '~/shared/navigation/routes'
import UsersFilterToolbar from './users-filter-toolbar.vue'
import UsersPermissionState from './users-permission-state.vue'
import UsersTable from './users-table.vue'
import UsersTableSkeleton from './users-table-skeleton.vue'
import { ADMIN_USERS_PAGE_SIZE, useAdminUsersListPage } from '../_composables/use-admin-users-list'

const {
  page,
  search,
  query,
  isPermissionDenied,
} = useAdminUsersListPage()

const { can } = usePermissions()
const canManageUsers = computed(() => can(PERMISSIONS.usersManage))

const entries = computed(() => query.data.value?.items ?? [])
const totalResults = computed(() => query.data.value?.meta.total ?? 0)

function retry() {
  void query.refetch()
}
</script>

<template>
  <LayoutAdminWrapperContent content-class="pb-12">
    <template #title>
      Users
    </template>
    <template #description>
      Every account on the platform, with the roles each one holds.
    </template>
    <template
      v-if="canManageUsers"
      #actions
    >
      <UButton :to="routes.usersNew()">
        New account
      </UButton>
    </template>
    <template #content>
      <UsersPermissionState v-if="isPermissionDenied" />

      <Empty
        v-else-if="query.isError.value"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load users"
        description="Something went wrong while loading the user list. Please try again."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      >
        <template #actions>
          <UButton
            color="gray"
            @click="retry"
          >
            Try again
          </UButton>
        </template>
      </Empty>

      <template v-else>
        <UsersFilterToolbar v-model:search="search" />

        <UsersTableSkeleton v-if="query.isPending.value" />

        <UsersTable
          v-else
          :users="entries"
          :page="page"
          :page-count="ADMIN_USERS_PAGE_SIZE"
          :total="totalResults"
          @update:page="page = $event"
        />
      </template>
    </template>
  </LayoutAdminWrapperContent>
</template>
