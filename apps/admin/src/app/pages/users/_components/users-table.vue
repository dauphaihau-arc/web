<script setup lang="ts">
import type { AdminUser } from '~/domains/users/api/contracts/admin-users.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import DataTable from '@arc/ui/patterns/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import {
  formatUserRoleLabel,
  formatUserStatusLabel,
  userStatusTone,
} from '~/domains/users/utils/user-presentation'
import FixedPagination from '@arc/ui/patterns/fixed-pagination.vue'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  users: AdminUser[]
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

type UserTableRow = {
  id: string
  email: string
  display_name: string
  status: string
  raw: AdminUser
}

const rows = computed<UserTableRow[]>(() =>
  props.users.map(user => ({
    id: user.id,
    email: user.email,
    display_name: user.display_name ?? '—',
    status: formatUserStatusLabel(user.status),
    raw: user,
  })),
)

const columns = [
  { key: 'email', label: 'Email' },
  { key: 'display_name', label: 'Display name' },
  { key: 'roles', label: 'Roles' },
  { key: 'status', label: 'Status' },
]

function openDetail(row: UserTableRow) {
  return navigateTo(routes.userDetail(row.id))
}
</script>

<template>
  <div>
    <DataTable
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="{ icon: ICON_NAME_BY_ALIAS.user, label: 'No users found.' }"
      clickable-rows
      @row-click="row => openDetail(row as UserTableRow)"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AppIcon
            :name="ICON_NAME_BY_ALIAS.user"
            size="lg"
            class="text-text-muted"
          />
          <p class="text-sm text-text-muted">
            No users match the current search.
          </p>
        </div>
      </template>

      <template #email-data="{ row }">
        <div class="break-all text-sm text-text-strong">
          {{ row.email }}
        </div>
      </template>

      <template #display_name-data="{ row }">
        <div class="text-sm text-text-muted">
          {{ row.display_name }}
        </div>
      </template>

      <template #roles-data="{ row }">
        <div class="flex flex-wrap items-center gap-1">
          <StatusBadge
            v-for="role in row.raw.roles"
            :key="role"
            color="gray"
            class="capitalize"
          >
            {{ formatUserRoleLabel(role) }}
          </StatusBadge>
          <span
            v-if="row.raw.roles.length === 0"
            class="text-sm text-text-muted"
          >
            No roles
          </span>
        </div>
      </template>

      <template #status-data="{ row }">
        <StatusBadge
          :color="userStatusTone(row.raw.status)"
          class="capitalize"
        >
          {{ row.status }}
        </StatusBadge>
      </template>
    </DataTable>

    <FixedPagination
      :page="page"
      :page-count="pageCount"
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
