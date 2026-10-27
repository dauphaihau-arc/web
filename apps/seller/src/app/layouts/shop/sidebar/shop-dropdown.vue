<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import { useLogout } from '~/domains/auth/mutations/logout.mutation'
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query'

const config = useRuntimeConfig()
const { data: myShop } = useGetMyShop()
const { mutate: logout } = useLogout()

const formattedShopName = computed(() => {
  const shopName = myShop.value?.shop_name

  if (!shopName) return ''

  return shopName.charAt(0).toUpperCase() + shopName.slice(1)
})

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
  <UDropdown
    :items="itemsShopDropdown as DropdownItem[][]"
    :popper="{ placement: 'bottom-start', offsetDistance: 20, offsetSkid: -8 }"
    class="mx-2 mb-6 mt-3 block w-auto rounded-md p-2 pr-3 duration-200 hover:bg-surface-hover"
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
            name="shop"
            size="xs"
          />
        </UButton>
        <div class="min-w-0 flex-1">
          <div class="truncate text-xs text-text-subtle">
            Seller Portal
          </div>
          <div class="truncate text-sm font-medium text-text-strong">
            {{ formattedShopName }}
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
</template>
