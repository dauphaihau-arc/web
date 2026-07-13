<script setup lang="ts">
import LoadingSvg from '../primitives/loading-svg.vue'

const props = defineProps<{
  isBackendPending: boolean
  isBackendError: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const shouldShowRetryAction = computed(() => props.isBackendError && !props.isBackendPending)
</script>

<template>
  <div
    class="fixed inset-0 z-[100] grid place-content-center bg-surface px-4"
  >
    <div
      class="flex items-center gap-3 rounded-full bg-surface px-3 py-2 text-sm text-text-subtle shadow-lg ring-1 ring-border-subtle"
    >
      <LoadingSvg
        v-if="isBackendPending"
        :child-class="'!w-4 !h-4'"
      />
      <span v-if="!shouldShowRetryAction">
        Waking up the backend server. This can take a few seconds.
      </span>
      <span v-else> The server is still unavailable. </span>
      <UButton
        v-if="shouldShowRetryAction"
        color="gray"
        size="xs"
        :ui="{ rounded: 'rounded-full' }"
        class="rounded-full"
        @click="emit('retry')"
      >
        Retry
      </UButton>
    </div>
  </div>
</template>
