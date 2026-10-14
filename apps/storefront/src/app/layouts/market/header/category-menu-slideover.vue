<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import Categories from './categories.vue'

const open = defineModel<boolean>({ required: true })
</script>

<template>
  <USlideover
    v-model="open"
    side="right"
    :ui="{ width: 'w-screen max-w-xs' }"
  >
    <div class="flex h-full flex-col bg-surface">
      <div class="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <span class="text-lg font-semibold">Categories</span>
        <UButton
          color="gray"
          variant="ghost"
          square
          :icon="ICON_NAME_BY_ALIAS['xMarkSolid']"
          aria-label="Close menu"
          @click="open = false"
        />
      </div>

      <div class="scrollbar-subtle flex-1 overflow-y-auto px-3 py-4">
        <Categories
          orientation="vertical"
          @select="open = false"
        />
      </div>
    </div>
  </USlideover>
</template>
