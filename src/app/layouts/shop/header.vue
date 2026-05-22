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
      class="header-bg"
      :class="{ scrolled }"
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

.header-bg {
  position: absolute;
  inset: 0;
  bottom: -4rem;
  pointer-events: none;
  backdrop-filter: blur(0px);
  background: transparent;
  -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
  transition:
    backdrop-filter 300ms,
    background 300ms;
  z-index: -1;
}

.header-bg.scrolled {
  backdrop-filter: blur(10px);
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.85) 0%, transparent 100%);
}

:global(.dark) .header-bg.scrolled {
  background: linear-gradient(to bottom, rgb(0 0 0 / 0.75) 0%, transparent 100%);
}
</style>
