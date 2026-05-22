<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import { shopHeaderCreateLinks } from '~/shared/navigation/menu'

const itemsHeaderDropdown: DropdownItem[][] = [
  shopHeaderCreateLinks.map(item => ({
    ...item,
    shortcuts: [...item.shortcuts],
    click: () => navigateTo(item.to),
  })),
]
</script>

<template>
  <header
    class="w-shop-layout-content fixed z-[1] flex items-center justify-between
               bg-white/50 py-3 pl-6 pr-10
               backdrop-blur-xl 2xl:pr-4 2xl:backdrop-blur-sm
              "
  >
    <div class="h-fit rounded-lg hover:bg-customGray-100">
      <!-- <UInput
        icon="i-heroicons-magnifying-glass-20-solid"
        placeholder="Search"
        variant="none"
        class="w-full text-customGray-800"
        :ui="{
          placeholder: 'placeholder-customGray-800',
          icon: {
            base: 'text-customGray-800',
          },
        }"
        size="md"
      /> -->
    </div>

    <div class="flex items-center gap-4">
      <UTooltip text="Notifications">
        <UButton
          color="gray"
          variant="ghost"
          class="icon-button"
        >
          <AppIcon
            name="bell"
            class="heroicon-sw-2"
          />
        </UButton>
      </UTooltip>
      <UTooltip text="Setting">
        <UButton
          color="gray"
          variant="ghost"
          class="icon-button"
        >
          <AppIcon
            name="settings"
            class="heroicon-sw-2"
          />
        </UButton>
      </UTooltip>
      <UDropdown :items="itemsHeaderDropdown">
        <UTooltip text="Create">
          <UButton
            :ui="{ rounded: 'rounded-full' }"
            icon="pajamas:plus"
            size="xs"
            color="primary"
            square
            variant="solid"
          />
        </UTooltip>
      </UDropdown>
    </div>
  </header>
</template>

<style scoped>
</style>
