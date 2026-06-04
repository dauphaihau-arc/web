<script setup lang="ts">
import LayoutShopSidebarSubLinks from './sidebar-sub-links.vue'
import type { LinkItem } from './sidebar.types'
import type { DropdownItem } from '#ui/types'
import { shopSidebarLinks } from '~/shared/navigation/menu'
import { useLogout } from '~/shared/server-state/auth/logout.mutation'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'

const route = useRoute()
const config = useRuntimeConfig()
const { data: myShop } = useGetMyShop()
const { mutate: logout } = useLogout()
const formattedShopName = computed(() => {
  const shopName = myShop.value?.shop_name

  if (!shopName) return ''

  return shopName.charAt(0).toUpperCase() + shopName.slice(1)
})
const shopInitial = computed(() => formattedShopName.value.charAt(0))

const itemsLinkSidebar: LinkItem[] = shopSidebarLinks

const isOpen = ref(false)

type ShopDropdownItem = Omit<DropdownItem, 'icon'> & {
  icon?: string
}

const itemsShopDropdown: ShopDropdownItem[][] = [
  [
    {
      label: 'Arc Marketplace',
      icon: 'marketplace',
      click: () => {
        navigateTo(config.public.storefrontAppURL, { external: true })
      },
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'logout',
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
      :items="itemsShopDropdown as DropdownItem[][]"
      :popper="{ placement: 'bottom-start', offsetDistance: 20, offsetSkid: -8 }"
      class="mx-4 mb-6 mt-3 block w-auto rounded-md p-2 pr-3 duration-200 hover:bg-customGray-200/50"
    >
      <template #item="{ item }">
        <div class="flex items-center gap-2">
          <UAvatar
            v-if="item.avatar"
            size="2xs"
            v-bind="item.avatar"
          />
          <AppIcon
            v-else-if="item.icon"
            :name="item.icon"
            size="xs"
            class="text-gray-500"
          />
          <span>{{ item.label }}</span>
        </div>
      </template>

      <div class="flex w-full items-center gap-2">
        <UButton
          color="gray"
          size="sm"
        >
          <span class="text-xs font-semibold uppercase">
            {{ shopInitial }}
          </span>
        </UButton>
        <div class="min-w-0 flex-1 text-sm font-medium text-customGray-950">
          {{ formattedShopName }}
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
          class="flex w-full"
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
            class="flex-1"
          >
            <NuxtLink
              :to="item?.disabled ? '' : item.to"
              prefetch
              class="link-default link-theme ml-2 mr-4 flex !w-full items-center gap-2"
              :class="[
                'pl-5',
                item.disabled
                  ? 'cursor-not-allowed opacity-50 text-customGray-900'
                  : item.matchPath && route.path.startsWith(item.matchPath) ? 'link-active' : 'link-inactive',
              ]"
            >
              <AppIcon
                v-if="item.icon"
                :name="item.icon"
                size="xs"
                class="shrink-0"
              />
              <span>{{ item.title }}</span>
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
