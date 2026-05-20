<script setup lang="ts">
import LayoutShopSidebarSubLinks from './sidebar-sub-links.vue'
import type { LinkItem } from './sidebar.types'
import type { DropdownItem } from '#ui/types'
import avatarDefault from '~/app/assets/images/avatar-default.jpg'
import { shopSidebarLinks } from '~/shared/navigation/menu'
import { routes as appRoutes } from '~/shared/navigation/routes'
import { useLogout } from '~/shared/server-state/auth/logout.mutation'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'

const route = useRoute()
const { data: dataUserAuth } = useGetCurrentUser()
const { mutate: logout } = useLogout()

const itemsLinkSidebar: LinkItem[] = shopSidebarLinks

const isOpen = ref(false)

const itemsShopDropdown: DropdownItem[][] = [
  [
    {
      label: 'Profile',
      avatar: {
        src: avatarDefault,
      },
      click: () => {
        navigateTo(appRoutes.account())
      },
    },
  ],
  [
    {
      label: 'Archive',
      icon: 'i-heroicons-archive-box-20-solid',
      disabled: true,
    },
    {
      label: 'Arc Marketplace',
      icon: 'i-heroicons-arrow-right-circle-20-solid',
      click: () => {
        navigateTo(appRoutes.home())
      },
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-left-start-on-rectangle',
      click: logout,
    },
  ],
]
</script>

<template>
  <aside
    class="w-shop-layout-sidebar fixed z-[3] h-full border-r border-gray-200"
    :class="[{ 'bg-layout-shop': !isOpen }]"
  >
    <UDropdown
      :items="itemsShopDropdown"
      :popper="{ placement: 'bottom-start', offsetDistance: 20, offsetSkid: -8 }"
      class="mx-4 mb-6 mt-3 rounded-md p-2 pr-3  duration-200 hover:bg-customGray-200/50"
    >
      <div class="flex items-center gap-2">
        <UButton
          color="gray"
          class="p-2"
        >
          <Icon
            name="uil:shop"
            class="size-4"
          />
        </UButton>
        <div class="text-sm font-medium text-customGray-950">
          {{ dataUserAuth?.user?.shop?.shop_name }}
        </div>
      </div>
    </UDropdown>

    <div class="relative flex flex-col gap-1">
      <div
        v-for="(item, index) of itemsLinkSidebar"
        :key="index"
      >
        <LayoutShopSidebarSubLinks
          v-if="item?.sub || !item.to"
          :data="item"
        />

        <div
          v-else
          class="flex"
        >
          <!--          :class="[item.disabled && 'opacity-50']" -->
          <UDivider
            :ui="{ border: { base: item.matchPath && route.path.startsWith(item.matchPath) ? 'border-primary' : 'border-transparent' } }"
            orientation="vertical"
            class="h-auto w-[3px]"
            size="sm"
          />

          <UTooltip
            text="Feature not available"
            :prevent="!item.disabled"
          >
            <NuxtLink
              :to="item?.disabled ? '' : item.to"
              prefetch
              class="link-default link-theme ml-2 mr-4 w-full"
              :class="[
                'pl-5',
                item.disabled
                  ? 'cursor-not-allowed opacity-50 text-customGray-900'
                  : item.matchPath && route.path.startsWith(item.matchPath) ? 'link-active' : 'link-inactive',
              ]"
            >
              {{ item.title }}
            </NuxtLink>
          </UTooltip>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
@import url("~/app/assets/css/layout-shop.css");
</style>
