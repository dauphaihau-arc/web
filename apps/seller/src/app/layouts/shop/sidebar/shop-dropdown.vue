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

const shopInitial = computed(() => formattedShopName.value.charAt(0))

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
          class="text-text-muted"
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
      <div class="min-w-0 flex-1 text-sm font-medium text-text-strong">
        {{ formattedShopName }}
      </div>
    </div>
  </UDropdown>
</template>
