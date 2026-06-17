<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ShortcutHint from '@arc/ui/shortcut-hint.vue'
import NotificationPopover from './notification-popover.vue'
import { shopHeaderCreateLinks } from '~/shared/navigation/menu'
import type { DropdownItem } from '#ui/types'

type HeaderDropdownItem = Omit<DropdownItem, 'icon' | 'shortcuts'> & {
  icon?: string
  shortcuts?: string[]
}

const itemsHeaderDropdown: HeaderDropdownItem[][] = [
  shopHeaderCreateLinks.map(item => ({
    ...item,
    shortcuts: item.shortcuts ? [...item.shortcuts] : undefined,
    click: () => navigateTo(item.to),
  })),
]

const scrolled = ref(false)
const pendingShortcutPrefix = ref<string | null>(null)
const shortcutSequenceTimeoutMs = 1500
let shortcutResetTimeout: number | null = null

function onScroll() {
  scrolled.value = window.scrollY > 10
}

function resetPendingShortcut() {
  pendingShortcutPrefix.value = null

  if (shortcutResetTimeout) {
    window.clearTimeout(shortcutResetTimeout)
    shortcutResetTimeout = null
  }
}

function armPendingShortcut(prefix: string) {
  pendingShortcutPrefix.value = prefix

  if (shortcutResetTimeout) {
    window.clearTimeout(shortcutResetTimeout)
  }

  shortcutResetTimeout = window.setTimeout(() => {
    resetPendingShortcut()
  }, shortcutSequenceTimeoutMs)
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (
    event.isComposing
    || event.repeat
    || event.metaKey
    || event.ctrlKey
    || event.altKey
    || isTypingTarget(event.target)
  ) {
    return
  }

  const key = event.key.toLowerCase()
  const matchingPrefix = shopHeaderCreateLinks.some(item =>
    item.sequence[0].toLowerCase() === key,
  )

  if (!pendingShortcutPrefix.value) {
    if (matchingPrefix) {
      event.preventDefault()
      armPendingShortcut(key)
    }

    return
  }

  const matchedItem = shopHeaderCreateLinks.find(item =>
    item.sequence[0].toLowerCase() === pendingShortcutPrefix.value
    && item.sequence[1].toLowerCase() === key,
  )

  resetPendingShortcut()

  if (matchedItem) {
    event.preventDefault()
    navigateTo(matchedItem.to)
    return
  }

  if (matchingPrefix) {
    event.preventDefault()
    armPendingShortcut(key)
  }
}

onKeyStroke(
  true,
  event => onGlobalKeydown(event),
  {
    target: document,
    dedupe: true,
  },
)

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  resetPendingShortcut()
})
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
              class="w-full text-text-subtle"
              :ui="{
                placeholder: 'placeholder-text-subtle',
                icon: {
                  base: 'text-text-subtle',
                },
              }"
              size="md"
            /> -->
          </div>

          <div class="flex items-center gap-4">
            <NotificationPopover />

            <!-- <UTooltip text="Setting">
              <UButton
                color="gray"
                variant="ghost"
                class="icon-button"
              >
                <AppIcon name="settings" />
              </UButton>
            </UTooltip> -->

            <UDropdown
              :items="itemsHeaderDropdown as DropdownItem[][]"
              :ui="{ width: 'w-50' }"
            >
              <template #item="{ item }">
                <div class="flex w-full items-center gap-3">
                  <AppIcon
                    v-if="item.icon"
                    :name="item.icon"
                    size="xs"
                    class="shrink-0 text-text-muted"
                  />
                  <span class="flex-1 whitespace-nowrap">{{ item.label }}</span>
                  <ShortcutHint
                    v-if="item.shortcuts?.length"
                    size="sm"
                    :keys="item.shortcuts"
                    separator="none"
                  />
                </div>
              </template>

              <UTooltip text="Create">
                <UButton
                  :ui="{ rounded: 'rounded-full' }"
                  size="xs"
                  color="primary"
                  square
                  variant="solid"
                  class="!p-[4px]"
                >
                  <AppIcon
                    name="plus"
                    class="!size-4"
                  />
                </UButton>
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
