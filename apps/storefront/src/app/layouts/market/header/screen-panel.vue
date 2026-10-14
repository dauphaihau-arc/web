<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

withDefaults(defineProps<{
  closeLabel: string
  closeTestId?: string
}>(), {
  closeTestId: undefined,
})

const open = defineModel<boolean>({ required: true })
</script>

<template>
  <USlideover
    v-model="open"
    :overlay="false"
    :transition="false"
    :ui="{ width: 'w-screen max-w-none' }"
  >
    <div class="flex h-full flex-col bg-surface">
      <div class="flex items-center justify-end px-4 py-3 md:px-12">
        <UButton
          :data-testid="closeTestId"
          color="gray"
          variant="ghost"
          square
          :icon="ICON_NAME_BY_ALIAS['xMarkSolid']"
          :aria-label="closeLabel"
          @click="open = false"
        />
      </div>

      <div class="scrollbar-subtle flex-1 overflow-y-auto">
        <slot />
      </div>
    </div>
  </USlideover>
</template>
