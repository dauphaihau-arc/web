<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

defineProps<{
  count: number
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <div
    v-if="count > 0"
    class="pointer-events-none fixed inset-x-0 bottom-6 z-10"
  >
    <div class="mx-auto flex w-full max-w-shop-layout">
      <div class="w-shop-layout-sidebar shrink-0" />

      <div class="flex grow justify-center px-4">
        <div
          class="pointer-events-auto flex min-w-[min(25rem,100%)] max-w-full flex-wrap items-center justify-between gap-1 rounded-lg border border-border-subtle bg-surface py-2 pl-4 pr-1.5 shadow-overlay"
        >
          <span class="mr-1 whitespace-nowrap text-sm font-medium text-text-strong">
            {{ count }} selected
          </span>

          <div class="flex items-center gap-1">
            <slot />

            <div class="mx-0.5 h-5 border-l border-border-subtle" />

            <UButton
              color="gray"
              variant="ghost"
              :icon="ICON_NAME_BY_ALIAS.xMarkSolid"
              aria-label="Clear selection"
              @click="emit('clear')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
