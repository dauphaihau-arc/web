<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import { routes } from '~/shared/navigation/routes'
import { useLogout } from '~/shared/server-state/auth/logout.mutation'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'

const emit = defineEmits<{
  hoverTrigger: []
}>()

const { data: dataUserAuth } = useGetCurrentUser()
const {
  mutate: logout,
  isPending: isPendingLogout,
} = useLogout()

type UserDropdownItem = Omit<DropdownItem, 'icon'> & {
  icon?: string
}

const itemsUserDropdown = computed<UserDropdownItem[][]>(() => [
  [
    {
      label: 'Orders',
      icon: 'orders',
      click: () => navigateTo(routes.orders()),
    },
    {
      label: 'Messages',
      icon: 'message',
      click: () => navigateTo(routes.accountMessages()),
    },
    {
      label: 'Account',
      icon: 'account',
      click: () => navigateTo(routes.account()),
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'logout',
      disabled: isPendingLogout.value,
      click: () => {
        if (isPendingLogout.value) return
        logout()
      },
    },
  ],
])

const userInitial = computed(() => {
  return dataUserAuth.value?.user?.display_name?.trim().charAt(0).toUpperCase() || 'U'
})
</script>

<template>
  <UDropdown
    :items="itemsUserDropdown as DropdownItem[][]"
    :popper="{ placement: 'bottom' }"
    :ui="{ width: 'w-32' }"
  >
    <template #item="{ item }">
      <div class="flex items-center gap-2">
        <AppIcon
          v-if="item.icon"
          :name="item.icon"
          size="xs"
          class="text-text-muted"
        />
        <span>{{ item.label }}</span>
      </div>
    </template>

    <template #default="{ open: isAccountDropdownOpen }">
      <UTooltip
        text="My account"
        :prevent="isAccountDropdownOpen"
      >
        <UButton
          color="gray"
          variant="ghost"
          class="rounded-full p-1.5"
          @mouseover="emit('hoverTrigger')"
        >
          <div class="user-avatar">
            {{ userInitial }}
          </div>
        </UButton>
      </UTooltip>
    </template>
  </UDropdown>
</template>

<style scoped lang="postcss">
.user-avatar {
  @apply flex size-6 items-center justify-center rounded-full bg-customGray-200 text-text-strong text-sm font-semibold;
}
</style>
