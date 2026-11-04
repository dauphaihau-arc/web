<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  empty?: boolean
  emptyText?: string
  loadingText?: string
  minHeightClass?: string
  asideClass?: string
  listClass?: string
}>(), {
  loading: false,
  empty: false,
  emptyText: 'No conversations yet.',
  loadingText: 'Loading conversations...',
  minHeightClass: 'h-52',
  asideClass: 'border-b border-border-subtle lg:border-b-0 lg:border-r',
  listClass: 'scrollbar-subtle max-h-[70vh] overflow-y-auto',
})
</script>

<template>
  <aside :class="asideClass">
    <slot name="toolbar" />

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
      :class="listClass"
    >
      <slot />
    </div>
  </aside>
</template>
