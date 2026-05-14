<script setup lang="ts">
defineProps<{
  isBackendPending: boolean
  isBackendError: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-[100] grid place-content-center bg-white px-4">
    <div class="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm text-zinc-700 shadow-lg ring-1 ring-zinc-200">
      <LoadingSvg
        v-if="isBackendPending"
        :child-class="'!w-4 !h-4'"
      />
      <span v-if="isBackendPending">
        Waking up the server. This can take a few seconds.
      </span>
      <span v-else>
        The server is still unavailable.
      </span>
      <UButton
        v-if="isBackendError"
        color="gray"
        size="xs"
        @click="emit('retry')"
      >
        Retry
      </UButton>
    </div>
  </div>
</template>
