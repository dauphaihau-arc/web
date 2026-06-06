<script setup lang="ts">
withDefaults(defineProps<{
  hasConversation: boolean
  loading?: boolean
  empty?: boolean
  emptyStateText?: string
  loadingText?: string
  emptyMessagesText?: string
  listClass?: string
  composerClass?: string
  sectionClass?: string
}>(), {
  loading: false,
  empty: false,
  emptyStateText: 'Select a conversation to read and reply.',
  loadingText: 'Loading messages...',
  emptyMessagesText: 'No messages yet.',
  listClass: 'min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface-muted px-6 py-5',
  composerClass: 'mt-auto shrink-0 bg-surface-muted px-5 py-5',
  sectionClass: 'flex h-full min-h-0 flex-1 flex-col',
})
</script>

<template>
  <section :class="sectionClass">
    <AppStateBlock
      v-if="!hasConversation"
      class="grid flex-1 place-content-center px-6 border-0 shadow-none"
    >
      {{ emptyStateText }}
    </AppStateBlock>

    <template v-else>
      <slot name="header" />

      <div :class="listClass">
        <AppStateBlock
          v-if="loading"
          class="grid h-full place-content-center border-0 bg-transparent shadow-none"
        >
          {{ loadingText }}
        </AppStateBlock>

        <AppStateBlock
          v-else-if="empty"
          class="grid h-full place-content-center border-0 bg-transparent shadow-none"
        >
          {{ emptyMessagesText }}
        </AppStateBlock>

        <template v-else>
          <slot />
        </template>
      </div>

      <div :class="composerClass">
        <slot name="composer" />
      </div>
    </template>
  </section>
</template>
