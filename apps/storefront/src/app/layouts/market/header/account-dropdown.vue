<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import { routes } from '~/shared/navigation/routes'
import { useLogout } from '~/domains/auth/mutations/logout.mutation'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

const emit = defineEmits<{
  hoverTrigger: []
}>()

const { data: dataUserAuth } = useGetCurrentUser()
const { t } = useI18n()
const { localizePath } = useLocalizedRoute()
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
      label: t('header.account.menu.orders'),
      icon: 'orders',
      click: () => navigateTo(localizePath(routes.orders())),
    },
    {
      label: t('header.account.menu.messages'),
      icon: 'message',
      click: () => navigateTo(localizePath(routes.messages())),
    },
    {
      label: t('header.account.menu.account'),
      icon: 'account',
      click: () => navigateTo(localizePath(routes.account())),
    },
  ],
  [
    {
      label: t('header.account.menu.logout'),
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
        :text="$t('header.account.tooltip')"
        :prevent="isAccountDropdownOpen"
      >
        <UButton
          color="gray"
          variant="ghost"
          class="rounded-full p-1"
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
  @apply flex size-6 items-center justify-center rounded-full bg-surface-control text-text-strong text-sm font-semibold;
}
</style>
