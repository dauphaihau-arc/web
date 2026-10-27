<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import UserDetailCard from './user-detail-card.vue'
import UserEditForm from './user-edit-form.vue'
import UserRolesCard from './user-roles-card.vue'
import { useAdminUserDetailPage } from '../_composables/use-admin-user-detail-page'
import UsersPermissionState from '../../_components/users-permission-state.vue'

const props = defineProps<{
  userId: string
}>()

const {
  user,
  query,
  isPermissionDenied,
  isNotFound,
  retry,
} = useAdminUserDetailPage(() => props.userId)
</script>

<template>
  <LayoutAdminWrapperContent
    back-label="Users"
    :back-to="routes.users()"
    content-class="pb-12"
  >
    <template #title>
      {{ user ? (user.display_name?.trim() || user.email) : 'User details' }}
    </template>

    <template
      v-if="user"
      #description
    >
      {{ user.email }}
    </template>

    <template #content>
      <UsersPermissionState v-if="isPermissionDenied" />

      <Empty
        v-else-if="query.isPending.value"
        loading
        variant="naked"
        size="xl"
        description="Loading user..."
        container-class="min-h-[60vh]"
      />

      <Empty
        v-else-if="isNotFound"
        :icon="ICON_NAME_BY_ALIAS.user"
        title="User not found"
        description="This account may have been deleted, or the link is no longer valid."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      />

      <Empty
        v-else-if="query.isError.value || !user"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load user"
        description="Something went wrong while loading this user. Please try again."
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

      <div
        v-else
        class="grid grid-cols-12 gap-6"
      >
        <div class="col-span-12 xl:col-span-5">
          <UserDetailCard :user="user" />
        </div>

        <div class="col-span-12 space-y-6 xl:col-span-7">
          <UserEditForm
            :user-id="user.id"
            :user="user"
            :refetch="() => query.refetch()"
          />

          <UserRolesCard
            :user-id="user.id"
            :user="user"
          />
        </div>
      </div>
    </template>
  </LayoutAdminWrapperContent>
</template>
