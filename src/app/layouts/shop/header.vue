<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { DropdownItem } from '#ui/types'
import { shopHeaderCreateLinks } from '~/shared/navigation/menu'

const itemsHeaderDropdown: DropdownItem[][] = [
  shopHeaderCreateLinks.map(item => ({
    ...item,
    shortcuts: [...item.shortcuts],
    click: () => navigateTo(item.to),
  })),
]

const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 10
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="shop-header fixed inset-x-0 z-[1] py-3"
  >
    <div
      class="surface-backdrop"
      :class="{ 'surface-backdrop-active': scrolled }"
    />
    <div class="max-w-shop-layout mx-auto flex">
      <div class="w-shop-layout-sidebar shrink-0" />

      <div class="min-w-0 grow">
        <div class="shop-layout-content-inner flex items-center justify-between">
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
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.shop-header {
  position: fixed;
}
</style>
