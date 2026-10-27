<script setup lang="ts">
import type { AdminUser } from '~/domains/users/api/contracts/admin-users.contract'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import {
  formatUserRoleLabel,
  formatUserStatusLabel,
  userStatusTone,
} from '~/domains/users/utils/user-presentation'
import UserDetailInfoItem from './user-detail-info-item.vue'

const props = defineProps<{
  user: AdminUser
}>()

const hasRoles = computed(() => props.user.roles.length > 0)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Account
    </div>

    <div class="mt-4 space-y-4 text-sm">
      <UserDetailInfoItem label="Email">
        <span class="break-all">{{ user.email }}</span>
      </UserDetailInfoItem>

      <UserDetailInfoItem label="Display name">
        {{ user.display_name || '—' }}
      </UserDetailInfoItem>

      <UserDetailInfoItem label="Status">
        <StatusBadge
          :color="userStatusTone(user.status)"
          class="capitalize"
        >
          {{ formatUserStatusLabel(user.status) }}
        </StatusBadge>
      </UserDetailInfoItem>

      <UserDetailInfoItem label="Roles">
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
            v-if="!hasRoles"
            class="text-sm text-text-muted"
          >
            No roles
          </span>
        </div>
      </UserDetailInfoItem>

      <UserDetailInfoItem label="Version">
        {{ user.version }}
      </UserDetailInfoItem>
    </div>
  </UCard>
</template>
