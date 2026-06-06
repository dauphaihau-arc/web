<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  totalResults?: number
  totalLabel?: string
  loading?: boolean
  empty?: boolean
  emptyText?: string
  loadingText?: string
  minHeightClass?: string
  asideClass?: string
}>(), {
  title: 'Conversations',
  totalResults: 0,
  totalLabel: 'total threads',
  loading: false,
  empty: false,
  emptyText: 'No conversations yet.',
  loadingText: 'Loading conversations...',
  minHeightClass: 'h-52',
  asideClass: 'border-b border-border-subtle lg:border-b-0 lg:border-r',
})
</script>

<template>
  <aside :class="asideClass">
    <div class="border-b border-border-subtle px-5 py-4">
      <div class="text-sm font-semibold text-text-strong">
        {{ title }}
      </div>
      <div class="text-sm text-text-muted">
        {{ totalResults }} {{ totalLabel }}
      </div>
    </div>

    <AppStateBlock
      v-if="loading"
      :class="['grid place-content-center border-0 shadow-none', minHeightClass]"
    >
      {{ loadingText }}
    </AppStateBlock>

    <AppStateBlock
      v-else-if="empty"
      :class="['grid place-content-center px-6 border-0 shadow-none', minHeightClass]"
    >
      {{ emptyText }}
    </AppStateBlock>

    <div
      v-else
      class="max-h-[70vh] overflow-y-auto"
    >
      <slot />
    </div>
  </aside>
</template>
