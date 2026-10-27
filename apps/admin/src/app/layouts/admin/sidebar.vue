<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { DropdownItem } from '#ui/types'
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import { getRoutePath, isRouteActive, routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useLogout } from '~/domains/auth/mutations/logout.mutation'
import { usePermissions } from '~/shared/composables/use-permissions'

type NavigationItem = {
  title: string
  icon: string
  to: RouteLocationRaw
}

const route = useRoute()
const { data: currentUser } = useGetCurrentUser()
const { mutate: logout } = useLogout()
const { can } = usePermissions()

const userEmail = computed(() => currentUser.value?.user?.email ?? '')

const itemsNavigation = computed<NavigationItem[]>(() => [
  {
    title: 'Shops',
    icon: 'shop',
    to: routes.shops(),
  },
  {
    title: 'Orders',
    icon: 'orders',
    to: routes.orders(),
  },
  // Only roles with user management see the users surface.
  ...(can(PERMISSIONS.usersRead)
    ? [{
        title: 'Users',
        icon: 'user',
        to: routes.users(),
      }]
    : []),
  // The audit trail is its own surface; sellers and other roles never see it.
  ...(can(PERMISSIONS.auditRead)
    ? [{
        title: 'Audit',
        icon: 'auditLog',
        to: routes.audit(),
      }]
    : []),
])

const itemsAccountMenu: DropdownItem[][] = [
  [
    {
      label: 'Log out',
      icon: 'logout',
      click: () => logout(),
    },
  ],
]

function isItemActive(to: RouteLocationRaw) {
  return isRouteActive(route.path, getRoutePath(to))
}
</script>

<template>
  <aside class="fixed z-[3] h-full w-shop-layout-sidebar border-r border-border-subtle bg-layout-shop">
    <UDropdown
      :items="itemsAccountMenu"
      :popper="{ placement: 'bottom-start', offsetDistance: 20, offsetSkid: -8 }"
      class="mx-2 mb-6 mt-3 block w-auto rounded-md p-2 pr-3 duration-200 hover:bg-surface-hover"
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

      <template #default="{ open }">
        <div class="flex w-full items-center gap-2">
          <UButton
            square
            color="gray"
            size="md"
            class="!size-9 shrink-0 justify-center !p-0"
            :ui="{ rounded: 'rounded-lg' }"
          >
            <AppIcon
              name="adminPortal"
              size="xs"
            />
          </UButton>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-text-strong">
              Admin Portal
            </div>
            <div class="truncate text-[11px] leading-4 text-text-subtle">
              {{ userEmail }}
            </div>
          </div>
          <AppIcon
            name="chevronDown"
            size="xs"
            class="shrink-0 text-text-muted transition-transform duration-200"
            :class="{ 'rotate-180': open }"
          />
        </div>
      </template>
    </UDropdown>

    <div class="relative flex flex-col gap-1">
      <div
        v-for="item of itemsNavigation"
        :key="item.title"
        class="flex w-full"
      >
        <UDivider
          :ui="{ border: { base: isItemActive(item.to) ? 'border-primary' : 'border-transparent' } }"
          orientation="vertical"
          class="h-auto w-[3px]"
          size="sm"
        />

        <NuxtLink
          :to="item.to"
          prefetch
          class="link-default link-theme ml-2 mr-4 flex !w-full items-center gap-2 pl-5"
          :class="isItemActive(item.to) ? 'link-active' : 'link-inactive'"
        >
          <AppIcon
            :name="item.icon"
            size="xs"
            class="shrink-0"
          />
          <span>{{ item.title }}</span>
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.link-default {
  @apply font-medium text-sm;
}

.link-theme {
  @apply py-1.5 px-3 rounded-md transition-all duration-200;
}

.link-active {
  @apply text-primary hover:bg-primary/5;
}

.link-inactive {
  @apply text-text-strong hover:bg-surface-hover;
}
</style>
